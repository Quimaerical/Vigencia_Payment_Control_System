import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { EstadoDeuda, EstadoSolicitud } from '@app/shared'
import SolicitudPago from '#models/solicitud_pago'
import Deuda from '#models/deuda'
import Proyecto from '#models/proyecto'
import { crearSolicitudPagoValidator, rechazarConMotivoValidator } from '#validators/finanzas'
import { filtrosListadoValidator } from '#validators/filtros'
import {
  esGenerador,
  esReceptor,
  leerDetalleFinanciero,
  operarFinanzasNoAdmin,
} from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'
import { parametrosPaginacion, respuestaPaginada } from '#services/paginacion'

export default class SolicitudesPagoController {
  /**
   * Lista todas las solicitudes de pago con sus relaciones (roles 'generador' y 'receptor') — paginado (máx. 100 por página)
   */
  async listar({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(leerDetalleFinanciero)
    const filtros = await request.validateUsing(filtrosListadoValidator)
    const estado = request.input('estado')

    const query = SolicitudPago.query()
      .preload('proyecto')
      .preload('grupoPago')
      .preload('creadoPor')
      .preload('revisadoPor')
      .preload('deudas', (q) => q.preload('persona'))
      .preload('pagos')
      .orderBy('id', 'desc')

    if (filtros.proyectoId) query.where('proyecto_id', filtros.proyectoId)
    if (estado) query.where('estado', String(estado))

    const { pagina, limite } = parametrosPaginacion(filtros)
    const solicitudes = await query.paginate(pagina, limite)
    return response.status(200).json(respuestaPaginada(solicitudes))
  }

  /**
   * Muestra el detalle consolidado de una solicitud de pago (roles 'generador' y 'receptor')
   */
  async mostrar({ auth, bouncer, params, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(leerDetalleFinanciero)

    const solicitud = await SolicitudPago.query()
      .where('id', Number(params.id))
      .preload('proyecto')
      .preload('grupoPago')
      .preload('creadoPor')
      .preload('revisadoPor')
      .preload('deudas', (q) => q.preload('persona').preload('grupoPago'))
      .preload('pagos')
      .first()

    if (!solicitud) {
      return response.status(404).json({
        codigo: 'SOLICITUD_NO_ENCONTRADA',
        mensaje: 'La solicitud de pago especificada no existe.',
      })
    }

    return response.status(200).json({ data: solicitud })
  }

  /**
   * Crea una solicitud de pago agrupando causaciones/deudas pendientes (rol 'generador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(crearSolicitudPagoValidator)
    const pInicio = DateTime.fromISO(payload.periodoInicio).startOf('day')
    const pFin = DateTime.fromISO(payload.periodoFin).startOf('day')

    if (!pInicio.isValid || !pFin.isValid || pFin < pInicio) {
      return response.status(422).json({
        codigo: 'PERIODO_INVALIDO',
        mensaje: 'Las fechas del período son inválidas o el fin es anterior al inicio.',
      })
    }

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = await Proyecto.query({ client: trx }).where('id', payload.proyectoId).first()

      if (!proyecto || !proyecto.estaActivo) {
        return response.status(422).json({
          codigo: 'PROYECTO_INVALIDO',
          mensaje: 'El proyecto especificado no existe o se encuentra inactivo.',
        })
      }

      const deudasQuery = Deuda.query({ client: trx })
        .forUpdate()
        .where('proyecto_id', payload.proyectoId)
        .whereNull('solicitud_id')
        .whereIn('estado', [EstadoDeuda.PENDIENTE, EstadoDeuda.ABONADO])
        .where('saldo_pendiente', '>', 0)

      if (payload.grupoPagoId) {
        deudasQuery.where('grupo_pago_id', payload.grupoPagoId)
      }

      if (payload.deudaIds && payload.deudaIds.length > 0) {
        deudasQuery.whereIn('id', payload.deudaIds)
      }

      const deudasParaAgrupar = await deudasQuery

      if (payload.deudaIds && payload.deudaIds.length > 0) {
        const idsUnicos = [...new Set(payload.deudaIds)]
        if (deudasParaAgrupar.length !== idsUnicos.length) {
          const encontrados = new Set(deudasParaAgrupar.map((d) => d.id))
          const noElegibles = idsUnicos.filter((id) => !encontrados.has(id))
          return response.status(422).json({
            codigo: 'DEUDAS_NO_ELEGIBLES',
            mensaje:
              'Una o más causaciones indicadas no existen, pertenecen a otro proyecto/grupo o ya están asociadas a una solicitud.',
            deudaIdsNoElegibles: noElegibles,
          })
        }
      }

      if (deudasParaAgrupar.length === 0) {
        return response.status(422).json({
          codigo: 'SIN_DEUDAS_PARA_AGRUPAR',
          mensaje:
            'No existen causaciones pendientes sin solicitud asignada para consolidar en este proyecto.',
        })
      }

      const montoTotal = Number(
        deudasParaAgrupar.reduce((acc, d) => acc + Number(d.saldoPendiente), 0).toFixed(2)
      )

      const solicitud = new SolicitudPago()
      solicitud.codigo = payload.codigo
      solicitud.proyectoId = payload.proyectoId
      solicitud.grupoPagoId = payload.grupoPagoId ?? null
      solicitud.periodoInicio = pInicio
      solicitud.periodoFin = pFin
      solicitud.montoTotal = montoTotal
      solicitud.estado = EstadoSolicitud.CREACION
      solicitud.creadoPorId = usuario.id
      solicitud.useTransaction(trx)
      await solicitud.save()

      for (const deuda of deudasParaAgrupar) {
        deuda.solicitudId = solicitud.id
        deuda.useTransaction(trx)
        await deuda.save()
      }

      return response.status(201).json({
        mensaje: 'Solicitud de pago creada exitosamente',
        data: solicitud,
        deudasAsociadas: deudasParaAgrupar.length,
      })
    })
  }

  /**
   * Envía la solicitud de pago a revisión gerencial: creacion -> envio (rol 'generador')
   */
  async enviar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const solicitud = await SolicitudPago.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!solicitud) {
        return response.status(404).json({
          codigo: 'SOLICITUD_NO_ENCONTRADA',
          mensaje: 'La solicitud de pago especificada no existe.',
        })
      }

      if (solicitud.estado !== EstadoSolicitud.CREACION) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo las solicitudes en estado 'creacion' pueden ser enviadas (estado actual: '${solicitud.estado}').`,
        })
      }

      solicitud.estado = EstadoSolicitud.ENVIO
      solicitud.fechaEnvio = DateTime.now()
      solicitud.useTransaction(trx)
      await solicitud.save()

      return response.status(200).json({
        mensaje: 'Solicitud de pago enviada a revisión exitosamente',
        data: solicitud,
      })
    })
  }

  /**
   * Aprueba una solicitud de pago enviada: envio -> aprobacion (rol 'receptor')
   */
  async aprobar({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const solicitud = await SolicitudPago.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!solicitud) {
        return response.status(404).json({
          codigo: 'SOLICITUD_NO_ENCONTRADA',
          mensaje: 'La solicitud de pago especificada no existe.',
        })
      }

      if (solicitud.estado !== EstadoSolicitud.ENVIO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo las solicitudes en estado 'envio' pueden ser aprobadas (estado actual: '${solicitud.estado}').`,
        })
      }

      solicitud.estado = EstadoSolicitud.APROBACION
      solicitud.revisadoPorId = usuario.id
      solicitud.fechaRevision = DateTime.now()
      solicitud.motivoRechazo = null
      solicitud.useTransaction(trx)
      await solicitud.save()

      return response.status(200).json({
        mensaje: 'Solicitud de pago aprobada exitosamente',
        data: solicitud,
      })
    })
  }

  /**
   * Rechaza una solicitud de pago con motivo justificado: envio -> rechazada (rol 'receptor')
   */
  async rechazar({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    const { motivoRechazo } = await request.validateUsing(rechazarConMotivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const solicitud = await SolicitudPago.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!solicitud) {
        return response.status(404).json({
          codigo: 'SOLICITUD_NO_ENCONTRADA',
          mensaje: 'La solicitud de pago especificada no existe.',
        })
      }

      if (solicitud.estado !== EstadoSolicitud.ENVIO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo las solicitudes en estado 'envio' pueden ser rechazadas (estado actual: '${solicitud.estado}').`,
        })
      }

      solicitud.estado = EstadoSolicitud.RECHAZADA
      solicitud.revisadoPorId = usuario.id
      solicitud.fechaRevision = DateTime.now()
      solicitud.motivoRechazo = motivoRechazo
      solicitud.useTransaction(trx)
      await solicitud.save()

      // Desvincular las deudas para que puedan incluirse en una nueva solicitud corregida
      const deudas = await Deuda.query({ client: trx }).where('solicitud_id', solicitud.id)
      for (const deuda of deudas) {
        deuda.solicitudId = null
        deuda.useTransaction(trx)
        await deuda.save()
      }

      return response.status(200).json({
        mensaje: 'Solicitud de pago rechazada y causaciones liberadas',
        data: solicitud,
      })
    })
  }

  /**
   * Cierra formalmente una solicitud una vez entregados los fondos: aprobacion|entrega -> cierre
   */
  async cerrar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(operarFinanzasNoAdmin)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const solicitud = await SolicitudPago.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!solicitud) {
        return response.status(404).json({
          codigo: 'SOLICITUD_NO_ENCONTRADA',
          mensaje: 'La solicitud de pago especificada no existe.',
        })
      }

      if (
        ![EstadoSolicitud.APROBACION, EstadoSolicitud.ENTREGA].includes(solicitud.estado as any)
      ) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `La solicitud debe estar en estado 'aprobacion' o 'entrega' para poder cerrarse (estado actual: '${solicitud.estado}').`,
        })
      }

      const deudasPendientes = await Deuda.query({ client: trx })
        .where('solicitud_id', solicitud.id)
        .whereNot('estado', EstadoDeuda.ANULADA)
        .where('saldo_pendiente', '>', 0)

      if (deudasPendientes.length > 0) {
        return response.status(422).json({
          codigo: 'DEUDAS_PENDIENTES_EN_SOLICITUD',
          mensaje:
            'No se puede cerrar la solicitud mientras existan causaciones con saldo pendiente de pago.',
          pendientesCount: deudasPendientes.length,
        })
      }

      solicitud.estado = EstadoSolicitud.CIERRE
      solicitud.useTransaction(trx)
      await solicitud.save()

      return response.status(200).json({
        mensaje: 'Solicitud de pago cerrada exitosamente',
        data: solicitud,
      })
    })
  }
}
