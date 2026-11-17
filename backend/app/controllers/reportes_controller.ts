import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { EstadoCajaChica, EstadoDeuda, EstadoPago, EstadoValeCaja } from '@app/shared'
import Pago from '#models/pago'
import Proyecto from '#models/proyecto'
import Persona from '#models/persona'
import SolicitudPago from '#models/solicitud_pago'
import AuditLog from '#models/audit_log'
import { generarReciboPagoPdf, generarSolicitudConsolidadaPdf } from '#services/pdf_service'
import { esAdministrador, leerDetalleFinanciero } from '#abilities/main'
import { filtrosAuditLogsValidator } from '#validators/filtros'

export default class ReportesController {
  /**
   * Responde las preguntas clave del sistema:
   * cuánto se ha causado, cuánto se ha pagado, cuándo, a quién, por qué proyecto y cuánto se adeuda.
   * El desglose por beneficiario (`porPersona`) es detalle financiero: solo lo reciben los
   * roles 'generador' y 'receptor'; el administrador recibe los totales (ADR 0002).
   */
  async resumen({ auth, bouncer, response }: HttpContext) {
    auth.getUserOrFail()
    const incluirPorPersona = await bouncer.allows(leerDetalleFinanciero)

    const [deudasKpiRow, pagosKpiRow, cajasKpiRow, valesKpiRow, proyectos, deudasPorProyectoRows] =
      await Promise.all([
        db
          .from('deudas')
          .whereNot('estado', EstadoDeuda.ANULADA)
          .select(
            db.raw('COALESCE(SUM(monto_original), 0) AS total_causado'),
            db.raw('COALESCE(SUM(saldo_pendiente), 0) AS saldo_exigible'),
            db.raw(
              'COALESCE(SUM(CASE WHEN saldo_pendiente > 0 THEN 1 ELSE 0 END), 0) AS pasivos_fifo_count'
            )
          )
          .first(),
        db
          .from('pagos')
          .where('estado', EstadoPago.PROCESADO)
          .select(db.raw('COALESCE(SUM(monto_total), 0) AS total_pagado'))
          .first(),
        db
          .from('cajas_chicas')
          .where('estado', EstadoCajaChica.ABIERTA)
          .select(db.raw('COALESCE(SUM(saldo_actual), 0) AS caja_chica_saldo'))
          .first(),
        db
          .from('vales_caja')
          .whereIn('estado', [
            EstadoValeCaja.SOLICITADO,
            EstadoValeCaja.APROBADO,
            EstadoValeCaja.DESEMBOLSADO,
          ])
          .count('* AS total')
          .first(),
        Proyecto.query().orderBy('id', 'asc'),
        db
          .from('deudas')
          .whereNot('estado', EstadoDeuda.ANULADA)
          .groupBy('proyecto_id')
          .select(
            'proyecto_id',
            db.raw('COALESCE(SUM(monto_original), 0) AS total_causado'),
            db.raw('COALESCE(SUM(saldo_pendiente), 0) AS saldo_adeudado')
          ),
      ])

    const totalCausado = Number(Number(deudasKpiRow?.total_causado ?? 0).toFixed(2))
    const saldoExigible = Number(Number(deudasKpiRow?.saldo_exigible ?? 0).toFixed(2))
    const pasivosFifoCount = Number(deudasKpiRow?.pasivos_fifo_count ?? 0)
    const totalPagado = Number(Number(pagosKpiRow?.total_pagado ?? 0).toFixed(2))
    const cajaChicaSaldo = Number(Number(cajasKpiRow?.caja_chica_saldo ?? 0).toFixed(2))
    const valesCustodiaCount = Number(valesKpiRow?.total ?? 0)
    const porcentajeCubierto =
      totalCausado > 0 ? Number(((totalPagado / totalCausado) * 100).toFixed(1)) : 0

    const kpis = {
      totalCausado,
      totalPagado,
      porcentajeCubierto,
      saldoExigible,
      pasivosFifoCount,
      cajaChicaSaldo,
      valesCustodiaCount,
    }

    const deudasPorProyectoMap = new Map<number, { causado: number; adeudado: number }>()
    for (const row of deudasPorProyectoRows) {
      deudasPorProyectoMap.set(Number(row.proyecto_id), {
        causado: Number(Number(row.total_causado ?? 0).toFixed(2)),
        adeudado: Number(Number(row.saldo_adeudado ?? 0).toFixed(2)),
      })
    }

    // Desglose por proyecto
    const porProyecto = proyectos.map((proy) => {
      const agg = deudasPorProyectoMap.get(proy.id)
      const causadoProy = agg?.causado ?? 0
      const pendienteProy = agg?.adeudado ?? 0
      const pagadoProy = Number((causadoProy - pendienteProy).toFixed(2))

      return {
        proyectoId: proy.id,
        codigo: proy.codigo,
        nombre: proy.nombre,
        area: proy.area,
        ambito: proy.ambito,
        totalCausado: causadoProy,
        totalPagado: pagadoProy,
        saldoAdeudado: pendienteProy,
      }
    })

    // Mínimo privilegio (ADR 0002, hallazgo A1): sin detalle por beneficiario para el
    // administrador; ni siquiera se consulta la tabla personas.
    if (!incluirPorPersona) {
      return response.status(200).json({ kpis, porProyecto })
    }

    const [personas, deudasPorPersonaRows, pagosPorPersonaRows] = await Promise.all([
      Persona.query().orderBy('id', 'asc'),
      db
        .from('deudas')
        .whereNot('estado', EstadoDeuda.ANULADA)
        .groupBy('persona_id')
        .select(
          'persona_id',
          db.raw('COALESCE(SUM(monto_original), 0) AS total_causado'),
          db.raw('COALESCE(SUM(saldo_pendiente), 0) AS saldo_adeudado')
        ),
      db
        .from('pagos')
        .where('estado', EstadoPago.PROCESADO)
        .groupBy('persona_id')
        .select(
          'persona_id',
          db.raw('COALESCE(SUM(monto_total), 0) AS total_pagado'),
          db.raw("TO_CHAR(MAX(fecha_pago), 'YYYY-MM-DD') AS fecha_ultimo_pago")
        ),
    ])

    const deudasPorPersonaMap = new Map<number, { causado: number; adeudado: number }>()
    for (const row of deudasPorPersonaRows) {
      deudasPorPersonaMap.set(Number(row.persona_id), {
        causado: Number(Number(row.total_causado ?? 0).toFixed(2)),
        adeudado: Number(Number(row.saldo_adeudado ?? 0).toFixed(2)),
      })
    }

    const pagosPorPersonaMap = new Map<number, { pagado: number; ultimoPago: string | null }>()
    for (const row of pagosPorPersonaRows) {
      pagosPorPersonaMap.set(Number(row.persona_id), {
        pagado: Number(Number(row.total_pagado ?? 0).toFixed(2)),
        ultimoPago: row.fecha_ultimo_pago ? String(row.fecha_ultimo_pago) : null,
      })
    }

    // Desglose de deuda y pagos por persona (beneficiario)
    const porPersona = personas.map((per) => {
      const aggDeuda = deudasPorPersonaMap.get(per.id)
      const aggPago = pagosPorPersonaMap.get(per.id)

      return {
        personaId: per.id,
        identificacion: per.identificacion,
        nombreCompleto: `${per.nombres} ${per.apellidos}`,
        totalCausado: aggDeuda?.causado ?? 0,
        totalPagado: aggPago?.pagado ?? 0,
        saldoAdeudado: aggDeuda?.adeudado ?? 0,
        fechaUltimoPago: aggPago?.ultimoPago ?? null,
      }
    })

    return response.status(200).json({ kpis, porProyecto, porPersona })
  }

  /**
   * Consulta el log de auditoría forense (audit_logs) con trazabilidad de quién, cuándo y qué cambió (rol 'administrador')
   */
  async auditLogs({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const filtros = await request.validateUsing(filtrosAuditLogsValidator)
    const tablaAfectada = request.input('tablaAfectada')
    const accion = request.input('accion')
    const limite = filtros.limite ?? 100

    const query = AuditLog.query().preload('usuario').orderBy('id', 'desc').limit(limite)

    if (tablaAfectada) query.where('tabla_afectada', String(tablaAfectada))
    if (accion) query.where('accion', String(accion))
    if (filtros.usuarioId) query.where('usuario_id', filtros.usuarioId)

    const logs = await query
    return response.status(200).json({ data: logs })
  }

  /**
   * Genera el PDF de un Recibo Individual de Pago (con detalle de amortización FIFO) (roles 'generador' y 'receptor')
   */
  async reciboPagoPdf({ auth, bouncer, params, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(leerDetalleFinanciero)

    const pago = await Pago.query()
      .where('id', Number(params.id))
      .preload('persona')
      .preload('usuario')
      .preload('solicitudPago')
      .preload('prorrateos', (q) => q.preload('deuda', (dq) => dq.preload('proyecto')))
      .first()

    if (!pago) {
      return response.status(404).json({
        codigo: 'PAGO_NO_ENCONTRADO',
        mensaje: 'El pago especificado no existe.',
      })
    }

    const pdfBuffer = generarReciboPagoPdf({
      pagoId: pago.id,
      fechaPago: pago.fechaPago.toISODate() ?? '',
      estado: pago.estado,
      metodoPago: pago.metodoPago,
      numeroReferencia: pago.numeroReferencia,
      montoTotal: Number(pago.montoTotal),
      beneficiarioNombre: `${pago.persona.nombres} ${pago.persona.apellidos}`,
      beneficiarioIdentificacion: pago.persona.identificacion,
      operadorUsername: pago.usuario.username,
      solicitudCodigo: pago.solicitudPago?.codigo ?? null,
      amortizaciones: pago.prorrateos.map((pr) => ({
        deudaId: pr.deudaId,
        proyectoCodigo: pr.deuda?.proyecto?.codigo ?? `PROY-${pr.deuda?.proyectoId ?? ''}`,
        fechaVencimiento: pr.deuda?.fechaVencimiento?.toISODate() ?? '',
        montoAplicado: Number(pr.montoAplicado),
      })),
    })

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="recibo-pago-${pago.id}.pdf"`)
    return response.status(200).send(pdfBuffer)
  }

  /**
   * Genera el PDF de una Solicitud Consolidada de Pago (roles 'generador' y 'receptor')
   */
  async solicitudConsolidadaPdf({ auth, bouncer, params, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(leerDetalleFinanciero)

    const solicitud = await SolicitudPago.query()
      .where('id', Number(params.id))
      .preload('proyecto')
      .preload('creadoPor')
      .preload('revisadoPor')
      .preload('deudas', (q) => q.preload('persona'))
      .first()

    if (!solicitud) {
      return response.status(404).json({
        codigo: 'SOLICITUD_NO_ENCONTRADA',
        mensaje: 'La solicitud de pago especificada no existe.',
      })
    }

    const pdfBuffer = generarSolicitudConsolidadaPdf({
      solicitudId: solicitud.id,
      codigo: solicitud.codigo,
      proyectoCodigo: solicitud.proyecto.codigo,
      proyectoNombre: solicitud.proyecto.nombre,
      proyectoArea: String(solicitud.proyecto.area),
      periodoInicio: solicitud.periodoInicio.toISODate() ?? '',
      periodoFin: solicitud.periodoFin.toISODate() ?? '',
      estado: String(solicitud.estado),
      montoTotal: Number(solicitud.montoTotal),
      creadoPorUsername: solicitud.creadoPor.username,
      revisadoPorUsername: solicitud.revisadoPor?.username ?? null,
      causaciones: solicitud.deudas.map((d) => ({
        deudaId: d.id,
        beneficiarioIdentificacion: d.persona.identificacion,
        beneficiarioNombre: `${d.persona.nombres} ${d.persona.apellidos}`,
        diasActivos: d.diasActivos,
        diasPeriodo: d.diasPeriodo,
        montoOriginal: Number(d.montoOriginal),
        saldoPendiente: Number(d.saldoPendiente),
        estado: d.estado,
      })),
    })

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `inline; filename="solicitud-consolidada-${solicitud.codigo}.pdf"`
    )
    return response.status(200).send(pdfBuffer)
  }
}
