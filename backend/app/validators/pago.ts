import vine from '@vinejs/vine'
import { MetodoPago } from '@app/shared'

/**
 * Validador para el procesamiento de pagos mediante algoritmo FIFO
 */
export const procesarPagoValidator = vine.create({
  personaId: vine.number().positive(),
  proyectoId: vine.number().positive(),
  montoTotal: vine.number().positive().min(0.01),
  metodoPago: vine.enum(Object.values(MetodoPago)),
  numeroReferencia: vine.string().trim().maxLength(100).nullable().optional(),
  fechaPago: vine.date(),
})
