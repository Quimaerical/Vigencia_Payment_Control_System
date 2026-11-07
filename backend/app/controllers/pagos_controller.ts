import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Pago from '#models/pago'
import Deuda from '#models/deuda'
import Prorrateo from '#models/prorrateo'
import AuditLog from '#models/audit_log'

export default class PagosController {
  public async procesarPago({ request, response, auth }: HttpContext) {
    const { personaId, montoTotal, metodoPago, numeroReferencia, fechaPago, proyectoId } = request.only([
      'personaId',
      'montoTotal',
      'metodoPago',
      'numeroReferencia',
      'fechaPago',
      'proyectoId',
    ])

    // Determinar el usuario que procesa la operación (autenticado o suministrado)
    const usuarioId = auth?.user?.id ?? request.input('usuarioId') ?? 1

    // 1. Iniciar Transacción de Base de Datos (Seguridad Financiera y Concurrencia ACID)
    const trx = await db.transaction()

    try {
      // 2. Registrar el Pago Maestro
      const pago = new Pago()
      pago.personaId = Number(personaId)
      pago.usuarioId = Number(usuarioId)
      pago.montoTotal = Number(montoTotal)
      pago.metodoPago = metodoPago
      pago.numeroReferencia = numeroReferencia
      pago.fechaPago = fechaPago
      pago.useTransaction(trx)
      await pago.save()

      // 3. FIFO: Buscar deudas pendientes ordenadas por fecha de vencimiento más antigua
      // Nota técnica: Se usan nombres exactos en snake_case para las columnas de la consulta SQL
      const query = Deuda.query({ client: trx })
        .forUpdate()
        .where('persona_id', Number(personaId))
        .where('estado', 'pendiente')
        .where('saldo_pendiente', '>', 0)
        .orderBy('fecha_vencimiento', 'asc')

      if (proyectoId) {
        query.where('proyecto_id', Number(proyectoId))
      }

      const deudasPendientes = await query

      let montoRestante = Number(Number(montoTotal).toFixed(2))

      // 4. Algoritmo de Prorrateo e Imputación FIFO
      for (const deuda of deudasPendientes) {
        if (montoRestante <= 0) break

        const saldoActual = Number(Number(deuda.saldoPendiente).toFixed(2))
        const montoAAplicar = Number(Math.min(saldoActual, montoRestante).toFixed(2))

        // Actualizar el saldo de la deuda con precisión de 2 decimales
        const nuevoSaldo = Number((saldoActual - montoAAplicar).toFixed(2))
        deuda.saldoPendiente = nuevoSaldo
        if (nuevoSaldo === 0) {
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

        montoRestante = Number((montoRestante - montoAAplicar).toFixed(2))
      }

      // 5. Registro de Auditoría Forense
      const audit = new AuditLog()
      audit.accion = 'PROCESAR_PAGO_FIFO'
      audit.tablaAfectada = 'pagos'
      audit.registroId = pago.id
      audit.usuarioId = Number(usuarioId)
      audit.direccionIp = request.ip()
      audit.datosNuevos = {
        montoTotal,
        personaId,
        proyectoId: proyectoId ?? null,
        saldoSobrante: montoRestante,
      }
      audit.useTransaction(trx)
      await audit.save()

      // 6. Confirmar la transacción
      await trx.commit()

      return response.status(201).json({
        mensaje: 'Pago procesado exitosamente mediante FIFO',
        pagoId: pago.id,
        montoSobrante: montoRestante,
      })
    } catch (error) {
      // 7. Rollback: Revertir todo si hay error
      await trx.rollback()
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido al procesar el pago'
      return response.status(500).json({
        mensaje: 'Error procesando el pago. Transacción revertida.',
        error: mensajeError,
      })
    }
  }
}
