import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Pago from '#models/pago'
import Deuda from '#models/deuda'
import Prorrateo from '#models/prorrateo'
import AuditLog from '#models/audit_log'

export default class PagosController {
  public async procesarPago({ request, response }: HttpContext) {
    const { personaId, montoTotal, metodoPago, numeroReferencia, fechaPago } = request.only([
      'personaId', 'montoTotal', 'metodoPago', 'numeroReferencia', 'fechaPago'
    ])

    // 1. Iniciar Transacción de Base de Datos (Seguridad Financiera)
    const trx = await db.transaction()

    try {
      // 2. Registrar el Pago Maestro
      const pago = new Pago()
      pago.personaId = personaId
      pago.montoTotal = montoTotal
      pago.metodoPago = metodoPago
      pago.numeroReferencia = numeroReferencia
      pago.fechaPago = fechaPago
      pago.useTransaction(trx)
      await pago.save()

      // 3. FIFO: Buscar deudas pendientes ordenadas por fecha de vencimiento más antigua
      const deudasPendientes = await Deuda.query({ client: trx })
        .where('personaId', personaId)
        .where('estado', 'pendiente')
        .where('saldoPendiente', '>', 0)
        .orderBy('fechaVencimiento', 'asc')

      let montoRestante = Number(montoTotal)

      // 4. Algoritmo de Prorrateo
      for (const deuda of deudasPendientes) {
        if (montoRestante <= 0) break

        const saldoActual = Number(deuda.saldoPendiente)
        const montoAAplicar = Math.min(saldoActual, montoRestante)
        
        // Actualizar el saldo de la deuda
        deuda.saldoPendiente = saldoActual - montoAAplicar
        if (deuda.saldoPendiente === 0) {
          deuda.estado = 'pagada'
        }
        deuda.useTransaction(trx)
        await deuda.save()

        // Crear el puente (Prorrateo)
        const prorrateo = new Prorrateo()
        prorrateo.pagoId = pago.id
        prorrateo.deudaId = deuda.id
        prorrateo.montoAplicado = montoAAplicar
        prorrateo.useTransaction(trx)
        await prorrateo.save()

        montoRestante -= montoAAplicar
      }

      // 5. Registro de Auditoría Forense
      const audit = new AuditLog()
      audit.accion = 'PROCESAR_PAGO_FIFO'
      audit.tablaAfectada = 'pagos'
      audit.registroId = pago.id
      audit.datosNuevos = { montoTotal, personaId, saldoSobrante: montoRestante }
      audit.useTransaction(trx)
      await audit.save()

      // 6. Confirmar la transacción
      await trx.commit()

      return response.status(201).json({
        mensaje: 'Pago procesado exitosamente mediante FIFO',
        pagoId: pago.id,
        montoSobrante: montoRestante
      })

    } catch (error) {
      // 7. Rollback: Revertir todo si hay error
      await trx.rollback()
      return response.status(500).json({
        mensaje: 'Error procesando el pago. Transacción revertida.',
        error: error.message
      })
    }
  }
}
