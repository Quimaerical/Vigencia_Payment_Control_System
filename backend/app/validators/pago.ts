import vine from '@vinejs/vine'
import { MetodoPago } from '@app/shared'

/**
 * Validador para el procesamiento de pagos mediante algoritmo FIFO
 */
export const procesarPagoValidator = vine.create({
  personaId: vine.number().positive(),
  proyectoId: vine.number().positive(),
  solicitudId: vine.number().positive().nullable().optional(),
  montoTotal: vine.number().positive().min(0.01),
  metodoPago: vine.enum(Object.values(MetodoPago)),
  numeroReferencia: vine
    .string()
    .trim()
    .maxLength(100)
    .unique({ table: 'pagos', column: 'numero_referencia' })
    .nullable()
    .optional(),
  fechaPago: vine.date(),
})

/**
 * Validador para la anulación justificada de pagos (inmutabilidad financiera)
 */
export const anularPagoValidator = vine.create({
  motivoAnulacion: vine.string().trim().minLength(5).maxLength(500),
})
