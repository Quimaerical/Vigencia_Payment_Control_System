import type { HttpContext } from '@adonisjs/core/http'
import { EstadoDeuda, EstadoPago, EstadoSolicitud } from '@app/shared'
import Pago from '#models/pago'
import Deuda from '#models/deuda'
import Prorrateo from '#models/prorrateo'
import SolicitudPago from '#models/solicitud_pago'
import AuditLog from '#models/audit_log'
import { procesarPagoValidator } from '#validators/pago'
import { registrarPago } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class PagosController {
  /**
   * Procesa la amortización y registro de pagos mediante el algoritmo FIFO (First In, First Out).
   *
   * Principios técnicos y contables implementados:
   * 1. Ordenación FIFO por `fecha_vencimiento ASC`:
   *    Garantiza que el desembolso amortice prioritariamente la causación/deuda devengada
   *    más antigua de la persona en el proyecto específico, respetando la directriz contable.
   *
   * 2. Bloqueo pesimista a nivel de fila (`SELECT ... FOR UPDATE`):
   *    Bloquea las tuplas de deuda seleccionadas dentro de la transacción ACID PostgreSQL activa.
   *    Esto previene condiciones de carrera financieras y dobles amortizaciones si múltiples
   *    peticiones concurrentes intentan imputar pagos al mismo beneficiario simultáneamente.
   *
   * 3. Tratamiento Contable de Sobrepagos y Excedentes:
   *    El sistema valida previamente la deuda consolidada del proyecto (`totalDeudaPendiente`).
   *    Si `montoTotal > totalDeudaPendiente` o si no existen deudas pendientes, la operación es
   *    rechazada inmediatamente con HTTP 422 (`SOBREPAGO_NO_PERMITIDO` / `SIN_DEUDAS_PENDIENTES`).
   *    Esto garantiza la inmutabilidad financiera impidiendo el registro de fondos huérfanos sin
   *    respaldo contable en la tabla de prorrateos.
   *
   * 4. Auditoría Forense Integral:
   *    Genera trazas inmutables en `audit_logs` (formato JSONB) para el pago, las deudas amortizadas
   *    (con snapshot de saldo/estado anterior y nuevo) y cada prorrateo creado, asociando la IP real
   *    y el ID del usuario receptor que autorizó el pago.
   */
  public async procesarPago({ request, response, auth, bouncer }: HttpContext) {
    // 1. Autenticación y Autorización RBAC estricta (Solo rol 'receptor')
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(registrarPago)

    // 2. Validación de entrada con VineJS
    const payload = await request.validateUsing(procesarPagoValidator)
    const {
      personaId,
      proyectoId,
      solicitudId,
      montoTotal,
      metodoPago,
      numeroReferencia,
      fechaPago,
    } = payload

    const montoTotalRedondeado = Number(Number(montoTotal).toFixed(2))

    // 3. Ejecución transaccional ACID con bloqueo pesimista y contexto de sesión PostgreSQL
    return await ejecutarTransaccionFinanciera(
      { auth, request },
      async (trx) => {
        // 3.0 Validar pertenencia, proyecto y estado de solicitudId si fue informado
        if (solicitudId) {
          const solicitud = await SolicitudPago.query({ client: trx })
            .where('id', Number(solicitudId))
            .where('proyecto_id', Number(proyectoId))
            .whereIn('estado', [EstadoSolicitud.APROBACION, EstadoSolicitud.ENTREGA])
            .first()

          if (!solicitud) {
            return response.status(422).json({
              codigo: 'SOLICITUD_INVALIDA',
              mensaje:
                'La solicitud de pago no existe, no pertenece al proyecto especificado o no se encuentra en estado de aprobación o entrega.',
              solicitudId,
              proyectoId,
            })
          }
        }

        // 3.1 FIFO: Buscar deudas pendientes del proyecto ordenadas por vencimiento más antiguo
        const deudasQuery = Deuda.query({ client: trx })
          .forUpdate()
          .where('persona_id', Number(personaId))
          .where('proyecto_id', Number(proyectoId))
          .whereIn('estado', [EstadoDeuda.PENDIENTE, EstadoDeuda.ABONADO])
          .where('saldo_pendiente', '>', 0)
          .orderBy('fecha_vencimiento', 'asc')

        if (solicitudId) {
          deudasQuery.where('solicitud_id', Number(solicitudId))
        }

        const deudasPendientes = await deudasQuery

        if (deudasPendientes.length === 0) {
          return response.status(422).json({
            codigo: 'SIN_DEUDAS_PENDIENTES',
            mensaje: 'No existen deudas pendientes para la persona en el proyecto especificado.',
            personaId,
            proyectoId,
          })
        }

        // 3.2 Control estricto de sobrepago: el pago no puede exceder la deuda total del proyecto
        const totalDeudaPendiente = Number(
          deudasPendientes.reduce((acc, d) => acc + Number(d.saldoPendiente), 0).toFixed(2)
        )

        if (montoTotalRedondeado > totalDeudaPendiente) {
          return response.status(422).json({
            codigo: 'SOBREPAGO_NO_PERMITIDO',
            mensaje: 'El monto solicitado excede el total de la deuda pendiente en el proyecto.',
            deudaTotalPendiente: totalDeudaPendiente,
            montoSolicitado: montoTotalRedondeado,
          })
        }

        // 3.3 Registrar el Pago Maestro
        const pago = new Pago()
        pago.personaId = Number(personaId)
        pago.usuarioId = usuario.id
        pago.solicitudId = solicitudId ? Number(solicitudId) : null
        pago.montoTotal = montoTotalRedondeado
        pago.metodoPago = metodoPago
        pago.numeroReferencia = numeroReferencia ?? null
        pago.fechaPago = fechaPago
        pago.estado = EstadoPago.PROCESADO
        pago.useTransaction(trx)
        await pago.save()

        // 3.4 Algoritmo de Imputación FIFO y Prorrateo
        let montoRestante = montoTotalRedondeado
        const amortizaciones: Array<{
          prorrateoId: number
          deudaId: number
          montoAplicado: number
          saldoAnterior: number
          nuevoSaldo: number
          estadoAnterior: string
          nuevoEstado: string
        }> = []

        for (const deuda of deudasPendientes) {
          if (montoRestante <= 0) break

          const saldoAnterior = Number(Number(deuda.saldoPendiente).toFixed(2))
          const estadoAnterior = deuda.estado
          const montoAAplicar = Number(Math.min(saldoAnterior, montoRestante).toFixed(2))
          const nuevoSaldo = Number((saldoAnterior - montoAAplicar).toFixed(2))

          deuda.saldoPendiente = nuevoSaldo
          if (nuevoSaldo === 0) {
            deuda.estado = EstadoDeuda.LIQUIDADA
          }
          deuda.useTransaction(trx)
          await deuda.save()

          const prorrateo = new Prorrateo()
          prorrateo.pagoId = pago.id
          prorrateo.deudaId = deuda.id
          prorrateo.montoAplicado = montoAAplicar
          prorrateo.useTransaction(trx)
          await prorrateo.save()

          amortizaciones.push({
            prorrateoId: prorrateo.id,
            deudaId: deuda.id,
            montoAplicado: montoAAplicar,
            saldoAnterior,
            nuevoSaldo,
            estadoAnterior,
            nuevoEstado: deuda.estado,
          })

          montoRestante = Number((montoRestante - montoAAplicar).toFixed(2))
        }

        // 3.5 Trazabilidad Forense Completa en audit_logs
        // Auditoría del registro de Pago
        const auditPago = new AuditLog()
        auditPago.accion = 'CREAR_PAGO'
        auditPago.tablaAfectada = 'pagos'
        auditPago.registroId = pago.id
        auditPago.usuarioId = usuario.id
        auditPago.direccionIp = request.ip()
        auditPago.datosAnteriores = null
        auditPago.datosNuevos = {
          id: pago.id,
          personaId: pago.personaId,
          usuarioId: pago.usuarioId,
          solicitudId: pago.solicitudId,
          montoTotal: pago.montoTotal,
          metodoPago: pago.metodoPago,
          numeroReferencia: pago.numeroReferencia,
          fechaPago: pago.fechaPago.toISODate(),
          estado: pago.estado,
        }
        auditPago.useTransaction(trx)
        await auditPago.save()

        // Auditoría forense de cada Deuda amortizada y su Prorrateo asociado
        for (const item of amortizaciones) {
          const auditDeuda = new AuditLog()
          auditDeuda.accion = 'AMORTIZAR_DEUDA_FIFO'
          auditDeuda.tablaAfectada = 'deudas'
          auditDeuda.registroId = item.deudaId
          auditDeuda.usuarioId = usuario.id
          auditDeuda.direccionIp = request.ip()
          auditDeuda.datosAnteriores = {
            saldoPendiente: item.saldoAnterior,
            estado: item.estadoAnterior,
          }
          auditDeuda.datosNuevos = {
            saldoPendiente: item.nuevoSaldo,
            estado: item.nuevoEstado,
            montoAplicado: item.montoAplicado,
            pagoId: pago.id,
            prorrateoId: item.prorrateoId,
          }
          auditDeuda.useTransaction(trx)
          await auditDeuda.save()

          const auditProrrateo = new AuditLog()
          auditProrrateo.accion = 'CREAR_PRORRATEO'
          auditProrrateo.tablaAfectada = 'prorrateos'
          auditProrrateo.registroId = item.prorrateoId
          auditProrrateo.usuarioId = usuario.id
          auditProrrateo.direccionIp = request.ip()
          auditProrrateo.datosAnteriores = null
          auditProrrateo.datosNuevos = {
            pagoId: pago.id,
            deudaId: item.deudaId,
            montoAplicado: item.montoAplicado,
          }
          auditProrrateo.useTransaction(trx)
          await auditProrrateo.save()
        }

        // 3.6 Respuesta de éxito
        return response.status(201).json({
          mensaje: 'Pago procesado exitosamente mediante FIFO',
          pagoId: pago.id,
          montoAplicado: montoTotalRedondeado,
          deudasAmortizadas: amortizaciones.length,
          detalles: amortizaciones,
        })
      },
      { skipAutoAudit: true }
    )
  }
}
