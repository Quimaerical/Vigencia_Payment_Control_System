import vine from '@vinejs/vine'
import {
  diasEnterosNoNegativos,
  diasEnterosPositivos,
  idEnteroPositivo,
  montoNoNegativo,
  montoPositivo,
} from '#validators/filtros'

const isoDateString = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * Validadores para Motor de Causación y Prorrateo
 */
export const simularProrrateoValidator = vine.create({
  montoPeriodo: montoPositivo(),
  diasActivos: diasEnterosNoNegativos(),
  diasPeriodo: diasEnterosPositivos(),
})

export const generarCausacionLoteValidator = vine.create({
  proyectoId: idEnteroPositivo(),
  grupoPagoId: idEnteroPositivo().nullable().optional(),
  periodoInicio: isoDateString(),
  periodoFin: isoDateString(),
  fechaVencimiento: isoDateString().optional(),
  crearSolicitud: vine.boolean().optional(),
  codigoSolicitud: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(50)
    .unique({ table: 'solicitudes_pago', column: 'codigo' })
    .optional(),
})

export const anularRegistroValidator = vine.create({
  motivoAnulacion: vine.string().trim().minLength(5).maxLength(500),
})

/**
 * Validadores para Ciclo de Solicitudes de Pago
 */
export const crearSolicitudPagoValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(50)
    .unique({ table: 'solicitudes_pago', column: 'codigo' }),
  proyectoId: idEnteroPositivo(),
  grupoPagoId: idEnteroPositivo().nullable().optional(),
  periodoInicio: isoDateString(),
  periodoFin: isoDateString(),
  deudaIds: vine.array(idEnteroPositivo()).maxLength(1000).optional(),
})

export const rechazarConMotivoValidator = vine.create({
  motivoRechazo: vine.string().trim().minLength(5).maxLength(500),
})

/**
 * Validadores para Control de Cajas Chicas y Vales
 */
export const abrirCajaChicaValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(50)
    .unique({ table: 'cajas_chicas', column: 'codigo' }),
  nombre: vine.string().trim().minLength(3).maxLength(150),
  proyectoId: idEnteroPositivo(),
  cajaOrigenId: idEnteroPositivo().nullable().optional(),
  anio: vine.number().withoutDecimals().min(2020).max(2100),
  mes: vine.number().withoutDecimals().min(1).max(12),
  montoAsignado: montoNoNegativo(),
})

export const solicitarValeCajaValidator = vine.create({
  solicitantePersonaId: idEnteroPositivo(),
  montoSolicitado: montoPositivo(),
  concepto: vine.string().trim().minLength(3).maxLength(300),
})

export const rendirValeCajaValidator = vine.create({
  montoRendido: montoNoNegativo(),
  comprobanteReferencia: vine.string().trim().minLength(2).maxLength(150),
})
