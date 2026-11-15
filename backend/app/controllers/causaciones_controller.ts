import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { EstadoDeuda, EstadoSolicitud } from '@app/shared'
import Asignacion from '#models/asignacion'
import Deuda from '#models/deuda'
import Proyecto from '#models/proyecto'
import SolicitudPago from '#models/solicitud_pago'
import {
  simularProrrateoValidator,
  generarCausacionLoteValidator,
  anularRegistroValidator,
} from '#validators/finanzas'
import { esGenerador, leerDetalleFinanciero } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class CausacionesController {
  /**
   * Calcula matemáticamente el monto causado según días activos vs días totales del período
   */
  public static calcularMontoProrrateado(
    montoPeriodo: number,
    diasActivos: number,
    diasPeriodo: number
  ): number {
    if (diasPeriodo <= 0 || diasActivos <= 0 || montoPeriodo <= 0) {
      return 0
    }
    const diasEfectivos = Math.min(diasActivos, diasPeriodo)
    return Number(((diasEfectivos / diasPeriodo) * montoPeriodo).toFixed(2))
  }

  /**
   * Lista las causaciones / deudas registradas con filtros por proyecto, persona, solicitud o estado (roles 'generador' y 'receptor')
   */
  async listar({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(leerDetalleFinanciero)
    const proyectoId = request.input('proyectoId')
    const personaId = request.input('personaId')
    const solicitudId = request.input('solicitudId')
    const estado = request.input('estado')

    const query = Deuda.query()
      .preload('persona')
      .preload('proyecto')
      .preload('grupoPago')
      .preload('asignacion')
      .orderBy('fecha_vencimiento', 'asc')
      .orderBy('id', 'asc')

    if (proyectoId) query.where('proyecto_id', Number(proyectoId))
    if (personaId) query.where('persona_id', Number(personaId))
    if (solicitudId) query.where('solicitud_id', Number(solicitudId))
    if (estado) query.where('estado', String(estado))

    const deudas = await query
    return response.status(200).json({ data: deudas })
  }

  /**
   * Simulador de prorrateo sin persistencia en base de datos
   */
  async simular({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const { montoPeriodo, diasActivos, diasPeriodo } =
      await request.validateUsing(simularProrrateoValidator)

    if (diasActivos > diasPeriodo) {
      return response.status(422).json({
        codigo: 'DIAS_ACTIVOS_EXCEDIDOS',
        mensaje: 'Los días activos no pueden superar los días totales del período.',
      })
    }

    const montoCausado = CausacionesController.calcularMontoProrrateado(
      montoPeriodo,
      diasActivos,
      diasPeriodo
    )
    const factorProrrateo = Number((diasActivos / diasPeriodo).toFixed(6))

    return response.status(200).json({
      montoPeriodo: Number(montoPeriodo.toFixed(2)),
      diasActivos,
      diasPeriodo,
      factorProrrateo,
      montoCausado,
    })
  }

  /**
   * Genera causación y nómina por lote agrupado por proyecto y período (rol 'generador')
   */
  async generarLote({ auth, bouncer, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(generarCausacionLoteValidator)
    const pInicio = DateTime.fromISO(payload.periodoInicio).startOf('day')
    const pFin = DateTime.fromISO(payload.periodoFin).startOf('day')
    const fVencimiento = payload.fechaVencimiento
      ? DateTime.fromISO(payload.fechaVencimiento).startOf('day')
      : pFin

    if (!pInicio.isValid || !pFin.isValid || !fVencimiento.isValid) {
      return response.status(422).json({
        codigo: 'FECHAS_INVALIDAS',
        mensaje: 'Las fechas del período deben tener formato ISO válido (YYYY-MM-DD).',
      })
    }

    if (pFin < pInicio) {
      return response.status(422).json({
        codigo: 'PERIODO_INVALIDO',
        mensaje: 'La fecha de fin del período no puede ser anterior a la fecha de inicio.',
      })
    }

    const diasPeriodo = Math.floor(pFin.diff(pInicio, 'days').days) + 1

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = await Proyecto.query({ client: trx }).where('id', payload.proyectoId).first()

      if (!proyecto || !proyecto.estaActivo) {
        return response.status(422).json({
          codigo: 'PROYECTO_INVALIDO',
          mensaje: 'El proyecto especificado no existe o se encuentra inactivo.',
        })
      }

      const asignacionesQuery = Asignacion.query({ client: trx })
        .forUpdate()
        .where('proyecto_id', payload.proyectoId)
        .where('esta_activo', true)
        .orderBy('id', 'asc')

      if (payload.grupoPagoId) {
        asignacionesQuery.where('grupo_pago_id', payload.grupoPagoId)
      }

      const asignaciones = await asignacionesQuery

      if (asignaciones.length === 0) {
        return response.status(422).json({
          codigo: 'SIN_ASIGNACIONES_ACTIVAS',
          mensaje: 'No existen asignaciones activas para el proyecto y grupo de pago indicados.',
        })
      }

      const deudasCreadas: Deuda[] = []
      const omitidasPorDuplicidad: number[] = []

      for (const asig of asignaciones) {
        const asigInicio = asig.fechaInicio.startOf('day')
        const asigFin = asig.fechaFin ? asig.fechaFin.startOf('day') : null

        const inicioEfectivo = asigInicio > pInicio ? asigInicio : pInicio
        const finEfectivo = asigFin && asigFin < pFin ? asigFin : pFin

        if (finEfectivo < inicioEfectivo) {
          continue
        }

        const diasActivos = Math.floor(finEfectivo.diff(inicioEfectivo, 'days').days) + 1
        const montoCausado = CausacionesController.calcularMontoProrrateado(
          Number(asig.montoPeriodo),
          diasActivos,
          diasPeriodo
        )

        if (montoCausado <= 0) {
          continue
        }

        // Evitar doble causación para la misma asignación y período si no está anulada
        const existente = await Deuda.query({ client: trx })
          .where('asignacion_id', asig.id)
          .where('periodo_inicio', pInicio.toISODate()!)
          .where('periodo_fin', pFin.toISODate()!)
          .whereNot('estado', EstadoDeuda.ANULADA)
          .first()

        if (existente) {
          omitidasPorDuplicidad.push(asig.id)
          continue
        }

        const deuda = new Deuda()
        deuda.personaId = asig.personaId
        deuda.proyectoId = asig.proyectoId
        deuda.grupoPagoId = asig.grupoPagoId
        deuda.asignacionId = asig.id
        deuda.solicitudId = null
        deuda.creadoPorId = usuario.id
        deuda.montoOriginal = montoCausado
        deuda.saldoPendiente = montoCausado
        deuda.fechaVencimiento = fVencimiento
        deuda.periodoInicio = pInicio
        deuda.periodoFin = pFin
        deuda.diasActivos = diasActivos
        deuda.diasPeriodo = diasPeriodo
        deuda.estado = EstadoDeuda.PENDIENTE
        deuda.useTransaction(trx)
        await deuda.save()

        deudasCreadas.push(deuda)
      }

      if (deudasCreadas.length === 0) {
        return response.status(422).json({
          codigo: 'LOTE_SIN_CAUSACIONES_NUEVAS',
          mensaje:
            'No se generaron nuevas causaciones (verifique vigencias o si el período ya fue causado).',
          omitidasPorDuplicidad,
        })
      }

      const montoTotalLote = Number(
        deudasCreadas.reduce((acc, d) => acc + Number(d.montoOriginal), 0).toFixed(2)
      )

      let solicitudCreada: SolicitudPago | null = null
      if (payload.crearSolicitud) {
        const codigo =
          payload.codigoSolicitud ||
          `SOL-P${payload.proyectoId}-${pInicio.toFormat('yyyyMMdd')}-${Date.now().toString().slice(-4)}`

        solicitudCreada = new SolicitudPago()
        solicitudCreada.codigo = codigo
        solicitudCreada.proyectoId = payload.proyectoId
        solicitudCreada.grupoPagoId = payload.grupoPagoId ?? null
        solicitudCreada.periodoInicio = pInicio
        solicitudCreada.periodoFin = pFin
        solicitudCreada.montoTotal = montoTotalLote
        solicitudCreada.estado = EstadoSolicitud.CREACION
        solicitudCreada.creadoPorId = usuario.id
        solicitudCreada.useTransaction(trx)
        await solicitudCreada.save()

        for (const deuda of deudasCreadas) {
          deuda.solicitudId = solicitudCreada.id
          deuda.useTransaction(trx)
          await deuda.save()
        }
      }

      return response.status(201).json({
        mensaje: 'Causación y nómina por lote generada exitosamente',
        cantidadCausaciones: deudasCreadas.length,
        montoTotalLote,
        diasPeriodo,
        solicitudPago: solicitudCreada,
        causaciones: deudasCreadas,
      })
    })
  }

  /**
   * Anula justificadamente una causación/deuda sin pagos aplicados (inmutabilidad financiera)
   */
  async anular({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const { motivoAnulacion } = await request.validateUsing(anularRegistroValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const deuda = await Deuda.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!deuda) {
        return response.status(404).json({
          codigo: 'CAUSACION_NO_ENCONTRADA',
          mensaje: 'La causación/deuda especificada no existe.',
        })
      }

      if (deuda.estado === EstadoDeuda.ANULADA) {
        return response.status(422).json({
          codigo: 'CAUSACION_YA_ANULADA',
          mensaje: 'La causación/deuda ya se encuentra anulada.',
        })
      }

      if (Number(deuda.saldoPendiente) < Number(deuda.montoOriginal)) {
        return response.status(422).json({
          codigo: 'CAUSACION_CON_PAGOS_ACTIVOS',
          mensaje:
            'No se puede anular una causación que ya posee pagos imputados. Debe anular primero el pago correspondiente.',
        })
      }

      const solicitudIdAnterior = deuda.solicitudId

      if (solicitudIdAnterior) {
        const solicitud = await SolicitudPago.query({ client: trx })
          .forUpdate()
          .where('id', solicitudIdAnterior)
          .first()

        if (
          solicitud &&
          [EstadoSolicitud.APROBACION, EstadoSolicitud.ENTREGA, EstadoSolicitud.CIERRE].includes(
            solicitud.estado as any
          )
        ) {
          return response.status(422).json({
            codigo: 'SOLICITUD_YA_APROBADA_O_CERRADA',
            mensaje:
              'No se puede anular una causación vinculada a una solicitud aprobada, en entrega o cerrada.',
          })
        }

        deuda.estado = EstadoDeuda.ANULADA
        deuda.saldoPendiente = 0
        deuda.solicitudId = null
        deuda.motivoAnulacion = motivoAnulacion
        deuda.anuladoPorId = usuario.id
        deuda.fechaAnulacion = DateTime.now()
        deuda.useTransaction(trx)
        await deuda.save()

        if (solicitud) {
          solicitud.montoTotal = Number(
            Math.max(0, Number(solicitud.montoTotal) - Number(deuda.montoOriginal)).toFixed(2)
          )
          solicitud.useTransaction(trx)
          await solicitud.save()
        }
      } else {
        deuda.estado = EstadoDeuda.ANULADA
        deuda.saldoPendiente = 0
        deuda.motivoAnulacion = motivoAnulacion
        deuda.anuladoPorId = usuario.id
        deuda.fechaAnulacion = DateTime.now()
        deuda.useTransaction(trx)
        await deuda.save()
      }

      return response.status(200).json({
        mensaje: 'Causación anulada justificadamente',
        data: deuda,
      })
    })
  }
}
