import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { EstadoCajaChica, EstadoValeCaja } from '@app/shared'
import CajaChica from '#models/caja_chica'
import ValeCaja from '#models/vale_caja'
import Proyecto from '#models/proyecto'
import Persona from '#models/persona'
import {
  abrirCajaChicaValidator,
  solicitarValeCajaValidator,
  rechazarConMotivoValidator,
  rendirValeCajaValidator,
  anularRegistroValidator,
} from '#validators/finanzas'
import { esGenerador, esReceptor, operarFinanzasNoAdmin } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class CajasChicasController {
  /**
   * Lista todas las cajas chicas con proyecto, responsable, caja origen y vales
   */
  async listar({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const proyectoId = request.input('proyectoId')
    const estado = request.input('estado')

    const query = CajaChica.query()
      .preload('proyecto')
      .preload('responsable')
      .preload('cajaOrigen')
      .preload('vales', (q) => q.preload('solicitantePersona'))
      .orderBy('id', 'desc')

    if (proyectoId) query.where('proyecto_id', Number(proyectoId))
    if (estado) query.where('estado', String(estado))

    const cajas = await query
    return response.status(200).json({ data: cajas })
  }

  /**
   * Muestra el detalle de una caja chica y sus vales asociados
   */
  async mostrar({ auth, params, response }: HttpContext) {
    auth.getUserOrFail()

    const caja = await CajaChica.query()
      .where('id', Number(params.id))
      .preload('proyecto')
      .preload('responsable')
      .preload('cajaOrigen')
      .preload('vales', (q) =>
        q.preload('solicitantePersona').preload('tramitadoPor').preload('aprobadoPor')
      )
      .first()

    if (!caja) {
      return response.status(404).json({
        codigo: 'CAJA_CHICA_NO_ENCONTRADA',
        mensaje: 'La caja chica especificada no existe.',
      })
    }

    return response.status(200).json({ data: caja })
  }

  /**
   * Apertura mensual de caja chica asignada a un proyecto con soporte de arrastre de saldo (rol 'generador')
   */
  async abrir({ auth, bouncer, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(abrirCajaChicaValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = await Proyecto.query({ client: trx }).where('id', payload.proyectoId).first()

      if (!proyecto || !proyecto.estaActivo) {
        return response.status(422).json({
          codigo: 'PROYECTO_INVALIDO',
          mensaje: 'El proyecto especificado no existe o se encuentra inactivo.',
        })
      }

      let saldoInicial = 0
      if (payload.cajaOrigenId) {
        const cajaOrigen = await CajaChica.query({ client: trx })
          .forUpdate()
          .where('id', payload.cajaOrigenId)
          .first()

        if (!cajaOrigen || cajaOrigen.proyectoId !== payload.proyectoId) {
          return response.status(422).json({
            codigo: 'CAJA_ORIGEN_INVALIDA',
            mensaje: 'La caja chica de origen no existe o no pertenece al mismo proyecto.',
          })
        }

        if (cajaOrigen.estado !== EstadoCajaChica.CERRADA) {
          return response.status(422).json({
            codigo: 'CAJA_ORIGEN_NO_CERRADA',
            mensaje:
              'La caja chica del mes anterior debe estar cerrada antes de arrastrar su saldo.',
          })
        }

        const arrastreExistente = await CajaChica.query({ client: trx })
          .where('caja_origen_id', cajaOrigen.id)
          .first()

        if (arrastreExistente) {
          return response.status(422).json({
            codigo: 'ARRASTRE_YA_APLICADO',
            mensaje: 'El saldo de la caja chica de origen ya fue arrastrado a otra caja.',
          })
        }

        saldoInicial = Number(Number(cajaOrigen.saldoActual).toFixed(2))
      }

      const montoAsignado = Number(Number(payload.montoAsignado).toFixed(2))
      const saldoActual = Number((saldoInicial + montoAsignado).toFixed(2))

      const caja = new CajaChica()
      caja.codigo = payload.codigo
      caja.nombre = payload.nombre
      caja.proyectoId = payload.proyectoId
      caja.cajaOrigenId = payload.cajaOrigenId ?? null
      caja.responsableId = usuario.id
      caja.anio = payload.anio
      caja.mes = payload.mes
      caja.saldoInicial = saldoInicial
      caja.montoAsignado = montoAsignado
      caja.saldoActual = saldoActual
      caja.estado = EstadoCajaChica.ABIERTA
      caja.fechaApertura = DateTime.now()
      caja.useTransaction(trx)
      await caja.save()

      return response.status(201).json({
        mensaje: 'Caja chica abierta exitosamente',
        data: caja,
      })
    })
  }

  /**
   * Cierra una caja chica al finalizar el mes, habilitando el arrastre de su saldo_actual al mes siguiente
   */
  async cerrar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(operarFinanzasNoAdmin)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const caja = await CajaChica.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!caja) {
        return response.status(404).json({
          codigo: 'CAJA_CHICA_NO_ENCONTRADA',
          mensaje: 'La caja chica especificada no existe.',
        })
      }

      if (caja.estado === EstadoCajaChica.CERRADA) {
        return response.status(422).json({
          codigo: 'CAJA_CHICA_YA_CERRADA',
          mensaje: 'La caja chica ya se encuentra cerrada.',
        })
      }

      const valesPendientes = await ValeCaja.query({ client: trx })
        .where('caja_chica_id', caja.id)
        .whereIn('estado', [
          EstadoValeCaja.SOLICITADO,
          EstadoValeCaja.APROBADO,
          EstadoValeCaja.DESEMBOLSADO,
        ])

      if (valesPendientes.length > 0) {
        return response.status(422).json({
          codigo: 'VALES_PENDIENTES_DE_RENDICION',
          mensaje:
            'No se puede cerrar la caja chica mientras existan vales solicitados, aprobados o desembolsados sin rendir.',
          valesPendientesCount: valesPendientes.length,
        })
      }

      caja.estado = EstadoCajaChica.CERRADA
      caja.fechaCierre = DateTime.now()
      caja.useTransaction(trx)
      await caja.save()

      return response.status(200).json({
        mensaje: 'Caja chica cerrada exitosamente; su saldo actual está listo para arrastre',
        data: caja,
      })
    })
  }

  /**
   * Solicita un vale de caja chica para un beneficiario (rol 'generador')
   */
  async solicitarVale({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(solicitarValeCajaValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const caja = await CajaChica.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!caja) {
        return response.status(404).json({
          codigo: 'CAJA_CHICA_NO_ENCONTRADA',
          mensaje: 'La caja chica especificada no existe.',
        })
      }

      if (caja.estado !== EstadoCajaChica.ABIERTA) {
        return response.status(422).json({
          codigo: 'CAJA_CHICA_CERRADA',
          mensaje: 'No se pueden solicitar vales sobre una caja chica cerrada.',
        })
      }

      const persona = await Persona.query({ client: trx })
        .where('id', payload.solicitantePersonaId)
        .first()

      if (!persona || !persona.estaActivo) {
        return response.status(422).json({
          codigo: 'PERSONA_INVALIDA',
          mensaje: 'La persona solicitante no existe o se encuentra inactiva.',
        })
      }

      const montoSolicitado = Number(Number(payload.montoSolicitado).toFixed(2))
      if (montoSolicitado > Number(caja.saldoActual)) {
        return response.status(422).json({
          codigo: 'SALDO_CAJA_INSUFICIENTE',
          mensaje: 'El monto solicitado supera el saldo disponible en la caja chica.',
          saldoDisponible: Number(caja.saldoActual),
          montoSolicitado,
        })
      }

      const vale = new ValeCaja()
      vale.cajaChicaId = caja.id
      vale.solicitantePersonaId = persona.id
      vale.tramitadoPorId = usuario.id
      vale.montoSolicitado = montoSolicitado
      vale.concepto = payload.concepto
      vale.estado = EstadoValeCaja.SOLICITADO
      vale.fechaSolicitud = DateTime.now()
      vale.useTransaction(trx)
      await vale.save()

      return response.status(201).json({
        mensaje: 'Vale de caja chica solicitado exitosamente',
        data: vale,
      })
    })
  }

  /**
   * Aprueba gerencialmente un vale de caja chica: solicitado -> aprobado (rol 'receptor')
   */
  async aprobarVale({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const vale = await ValeCaja.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!vale) {
        return response.status(404).json({
          codigo: 'VALE_NO_ENCONTRADO',
          mensaje: 'El vale de caja especificado no existe.',
        })
      }

      if (vale.estado !== EstadoValeCaja.SOLICITADO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo los vales en estado 'solicitado' pueden aprobarse (estado actual: '${vale.estado}').`,
        })
      }

      vale.estado = EstadoValeCaja.APROBADO
      vale.aprobadoPorId = usuario.id
      vale.fechaAprobacion = DateTime.now()
      vale.motivoRechazo = null
      vale.useTransaction(trx)
      await vale.save()

      return response.status(200).json({
        mensaje: 'Vale de caja aprobado por gerencia exitosamente',
        data: vale,
      })
    })
  }

  /**
   * Rechaza gerencialmente un vale de caja chica: solicitado -> rechazado (rol 'receptor')
   */
  async rechazarVale({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    const { motivoRechazo } = await request.validateUsing(rechazarConMotivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const vale = await ValeCaja.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!vale) {
        return response.status(404).json({
          codigo: 'VALE_NO_ENCONTRADO',
          mensaje: 'El vale de caja especificado no existe.',
        })
      }

      if (vale.estado !== EstadoValeCaja.SOLICITADO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo los vales en estado 'solicitado' pueden rechazarse (estado actual: '${vale.estado}').`,
        })
      }

      vale.estado = EstadoValeCaja.RECHAZADO
      vale.aprobadoPorId = usuario.id
      vale.motivoRechazo = motivoRechazo
      vale.useTransaction(trx)
      await vale.save()

      return response.status(200).json({
        mensaje: 'Vale de caja rechazado',
        data: vale,
      })
    })
  }

  /**
   * Desembolsa los fondos de un vale aprobado descontando del saldo_actual de la caja chica (rol 'receptor')
   */
  async desembolsarVale({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const vale = await ValeCaja.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!vale) {
        return response.status(404).json({
          codigo: 'VALE_NO_ENCONTRADO',
          mensaje: 'El vale de caja especificado no existe.',
        })
      }

      if (vale.estado !== EstadoValeCaja.APROBADO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `El vale debe estar 'aprobado' antes de desembolsarse (estado actual: '${vale.estado}').`,
        })
      }

      const caja = await CajaChica.query({ client: trx })
        .forUpdate()
        .where('id', vale.cajaChicaId)
        .firstOrFail()

      const saldoActual = Number(Number(caja.saldoActual).toFixed(2))
      const montoSolicitado = Number(Number(vale.montoSolicitado).toFixed(2))

      if (montoSolicitado > saldoActual) {
        return response.status(422).json({
          codigo: 'SALDO_CAJA_INSUFICIENTE',
          mensaje: 'La caja chica no dispone de saldo suficiente para desembolsar este vale.',
          saldoDisponible: saldoActual,
          montoSolicitado,
        })
      }

      caja.saldoActual = Number((saldoActual - montoSolicitado).toFixed(2))
      caja.useTransaction(trx)
      await caja.save()

      vale.estado = EstadoValeCaja.DESEMBOLSADO
      vale.fechaDesembolso = DateTime.now()
      vale.useTransaction(trx)
      await vale.save()

      return response.status(200).json({
        mensaje: 'Fondos del vale desembolsados exitosamente',
        data: vale,
        saldoCajaRestante: caja.saldoActual,
      })
    })
  }

  /**
   * Registra la rendición de cuentas de un vale con comprobante y ajusta el saldo de la caja chica (rol 'receptor')
   */
  async rendirVale({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    const { montoRendido, comprobanteReferencia } =
      await request.validateUsing(rendirValeCajaValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const vale = await ValeCaja.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!vale) {
        return response.status(404).json({
          codigo: 'VALE_NO_ENCONTRADO',
          mensaje: 'El vale de caja especificado no existe.',
        })
      }

      if (vale.estado !== EstadoValeCaja.DESEMBOLSADO) {
        return response.status(422).json({
          codigo: 'TRANSICION_ESTADO_INVALIDA',
          mensaje: `Solo los vales 'desembolsado' pueden rendirse (estado actual: '${vale.estado}').`,
        })
      }

      const montoSolicitado = Number(Number(vale.montoSolicitado).toFixed(2))
      const montoRendidoRedondeado = Number(Number(montoRendido).toFixed(2))

      if (montoRendidoRedondeado > montoSolicitado) {
        return response.status(422).json({
          codigo: 'MONTO_RENDIDO_EXCEDE_VALE',
          mensaje:
            'El monto rendido no puede superar el monto desembolsado en el vale. Gestione un vale adicional por la diferencia.',
          montoSolicitado,
          montoRendido: montoRendidoRedondeado,
        })
      }

      const caja = await CajaChica.query({ client: trx })
        .forUpdate()
        .where('id', vale.cajaChicaId)
        .firstOrFail()

      const diferenciaVuelto = Number((montoSolicitado - montoRendidoRedondeado).toFixed(2))
      const nuevoSaldoCaja = Number((Number(caja.saldoActual) + diferenciaVuelto).toFixed(2))

      if (nuevoSaldoCaja < 0) {
        return response.status(422).json({
          codigo: 'SALDO_CAJA_INSUFICIENTE',
          mensaje: 'El excedente rendido supera el saldo disponible en la caja chica.',
        })
      }

      caja.saldoActual = nuevoSaldoCaja
      caja.useTransaction(trx)
      await caja.save()

      vale.montoRendido = montoRendidoRedondeado
      vale.comprobanteReferencia = comprobanteReferencia
      vale.fechaRendicion = DateTime.now()
      vale.estado = EstadoValeCaja.RENDIDO
      vale.useTransaction(trx)
      await vale.save()

      return response.status(200).json({
        mensaje: 'Vale de caja rendido con comprobante exitosamente',
        data: vale,
        saldoCajaActualizado: caja.saldoActual,
      })
    })
  }

  /**
   * Anula justificadamente un vale de caja chica y reintegra el monto al saldo_actual si aplica (rol 'receptor')
   */
  async anularVale({ auth, bouncer, params, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esReceptor)

    const { motivoAnulacion } = await request.validateUsing(anularRegistroValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const vale = await ValeCaja.query({ client: trx })
        .forUpdate()
        .where('id', Number(params.id))
        .first()

      if (!vale) {
        return response.status(404).json({
          codigo: 'VALE_NO_ENCONTRADO',
          mensaje: 'El vale de caja especificado no existe.',
        })
      }

      if (vale.estado === EstadoValeCaja.ANULADO) {
        return response.status(422).json({
          codigo: 'VALE_YA_ANULADO',
          mensaje: 'El vale de caja ya se encuentra anulado.',
        })
      }

      const caja = await CajaChica.query({ client: trx })
        .forUpdate()
        .where('id', vale.cajaChicaId)
        .firstOrFail()

      if (vale.estado === EstadoValeCaja.DESEMBOLSADO) {
        caja.saldoActual = Number(
          (Number(caja.saldoActual) + Number(vale.montoSolicitado)).toFixed(2)
        )
        caja.useTransaction(trx)
        await caja.save()
      } else if (vale.estado === EstadoValeCaja.RENDIDO) {
        const montoReintegrar = Number(vale.montoRendido ?? vale.montoSolicitado)
        caja.saldoActual = Number((Number(caja.saldoActual) + montoReintegrar).toFixed(2))
        caja.useTransaction(trx)
        await caja.save()
      }

      vale.estado = EstadoValeCaja.ANULADO
      vale.motivoAnulacion = motivoAnulacion
      vale.anuladoPorId = usuario.id
      vale.fechaAnulacion = DateTime.now()
      vale.useTransaction(trx)
      await vale.save()

      return response.status(200).json({
        mensaje: 'Vale de caja anulado justificadamente',
        data: vale,
        saldoCajaActualizado: caja.saldoActual,
      })
    })
  }
}
