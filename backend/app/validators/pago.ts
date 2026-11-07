import vine from '@vinejs/vine'

/**
 * Validador para el procesamiento de pagos mediante algoritmo FIFO
 */
export const procesarPagoValidator = vine.create({
  personaId: vine.number().positive(),
  montoTotal: vine.number().positive().min(0.01),
  metodoPago: vine.string().trim().minLength(3).maxLength(50),
  numeroReferencia: vine.string().trim().maxLength(100).nullable().optional(),
  fechaPago: vine.string().trim(),
  proyectoId: vine.number().positive().optional(),
  usuarioId: vine.number().positive().optional(),
})
