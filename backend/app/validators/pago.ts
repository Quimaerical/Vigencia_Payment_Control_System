import vine from '@vinejs/vine'
import { MetodoPago } from '@app/shared'
import { idEnteroPositivo, montoPositivo } from '#validators/filtros'

/**
 * Validador para el procesamiento de pagos mediante algoritmo FIFO
 */
export const procesarPagoValidator = vine.create({
  personaId: idEnteroPositivo(),
  proyectoId: idEnteroPositivo(),
  solicitudId: idEnteroPositivo().nullable().optional(),
  montoTotal: montoPositivo(),
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
