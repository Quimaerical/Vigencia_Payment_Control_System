import type { HttpContext } from '@adonisjs/core/http'
import { EstadoCajaChica, EstadoDeuda, EstadoPago, EstadoValeCaja } from '@app/shared'
import Deuda from '#models/deuda'
import Pago from '#models/pago'
import Proyecto from '#models/proyecto'
import Persona from '#models/persona'
import CajaChica from '#models/caja_chica'
import ValeCaja from '#models/vale_caja'
import SolicitudPago from '#models/solicitud_pago'
import AuditLog from '#models/audit_log'
import { generarReciboPagoPdf, generarSolicitudConsolidadaPdf } from '#services/pdf_service'

export default class ReportesController {
  /**
   * Responde las preguntas clave del sistema:
   * cuánto se ha causado, cuánto se ha pagado, cuándo, a quién, por qué proyecto y cuánto se adeuda.
   */
  async resumen({ auth, response }: HttpContext) {
    auth.getUserOrFail()

    const [deudas, pagos, proyectos, personas, cajasAbiertas, valesCustodia] = await Promise.all([
      Deuda.query().whereNot('estado', EstadoDeuda.ANULADA).preload('proyecto').preload('persona'),
      Pago.query().where('estado', EstadoPago.PROCESADO).preload('persona'),
      Proyecto.query().orderBy('id', 'asc'),
      Persona.query().orderBy('id', 'asc'),
      CajaChica.query().where('estado', EstadoCajaChica.ABIERTA),
      ValeCaja.query().whereIn('estado', [
        EstadoValeCaja.SOLICITADO,
        EstadoValeCaja.APROBADO,
        EstadoValeCaja.DESEMBOLSADO,
      ]),
    ])

    const totalCausado = Number(
      deudas.reduce((acc, d) => acc + Number(d.montoOriginal), 0).toFixed(2)
    )
    const saldoExigible = Number(
      deudas.reduce((acc, d) => acc + Number(d.saldoPendiente), 0).toFixed(2)
    )
    const totalPagado = Number(pagos.reduce((acc, p) => acc + Number(p.montoTotal), 0).toFixed(2))
    const pasivosFifoCount = deudas.filter((d) => Number(d.saldoPendiente) > 0).length
    const cajaChicaSaldo = Number(
      cajasAbiertas.reduce((acc, c) => acc + Number(c.saldoActual), 0).toFixed(2)
    )
    const porcentajeCubierto =
      totalCausado > 0 ? Number(((totalPagado / totalCausado) * 100).toFixed(1)) : 0

    // Desglose por proyecto
    const porProyecto = proyectos.map((proy) => {
      const deudasProy = deudas.filter((d) => d.proyectoId === proy.id)
      const causadoProy = Number(
        deudasProy.reduce((acc, d) => acc + Number(d.montoOriginal), 0).toFixed(2)
      )
      const pendienteProy = Number(
        deudasProy.reduce((acc, d) => acc + Number(d.saldoPendiente), 0).toFixed(2)
      )
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

    // Desglose de deuda y pagos por persona (beneficiario)
    const porPersona = personas.map((per) => {
      const deudasPer = deudas.filter((d) => d.personaId === per.id)
      const pagosPer = pagos.filter((p) => p.personaId === per.id)
      const causadoPer = Number(
        deudasPer.reduce((acc, d) => acc + Number(d.montoOriginal), 0).toFixed(2)
      )
      const adeudadoPer = Number(
        deudasPer.reduce((acc, d) => acc + Number(d.saldoPendiente), 0).toFixed(2)
      )
      const pagadoPer = Number(
        pagosPer.reduce((acc, p) => acc + Number(p.montoTotal), 0).toFixed(2)
      )
      const ultimoPago = pagosPer.length > 0 ? pagosPer[0].fechaPago.toISODate() : null

      return {
        personaId: per.id,
        identificacion: per.identificacion,
        nombreCompleto: `${per.nombres} ${per.apellidos}`,
        totalCausado: causadoPer,
        totalPagado: pagadoPer,
        saldoAdeudado: adeudadoPer,
        fechaUltimoPago: ultimoPago,
      }
    })

    return response.status(200).json({
      kpis: {
        totalCausado,
        totalPagado,
        porcentajeCubierto,
        saldoExigible,
        pasivosFifoCount,
        cajaChicaSaldo,
        valesCustodiaCount: valesCustodia.length,
      },
      porProyecto,
      porPersona,
    })
  }

  /**
   * Consulta el log de auditoría forense (audit_logs) con trazabilidad de quién, cuándo y qué cambió
   */
  async auditLogs({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const tablaAfectada = request.input('tablaAfectada')
    const accion = request.input('accion')
    const usuarioId = request.input('usuarioId')
    const limite = Math.min(Number(request.input('limite', 100)) || 100, 500)

    const query = AuditLog.query().preload('usuario').orderBy('id', 'desc').limit(limite)

    if (tablaAfectada) query.where('tabla_afectada', String(tablaAfectada))
    if (accion) query.where('accion', String(accion))
    if (usuarioId) query.where('usuario_id', Number(usuarioId))

    const logs = await query
    return response.status(200).json({ data: logs })
  }

  /**
   * Genera el PDF de un Recibo Individual de Pago (con detalle de amortización FIFO)
   */
  async reciboPagoPdf({ auth, params, response }: HttpContext) {
    auth.getUserOrFail()

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
   * Genera el PDF de una Solicitud Consolidada de Pago
   */
  async solicitudConsolidadaPdf({ auth, params, response }: HttpContext) {
    auth.getUserOrFail()

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
