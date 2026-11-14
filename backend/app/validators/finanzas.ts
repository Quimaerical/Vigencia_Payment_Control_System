import vine from '@vinejs/vine'

const isoDateString = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * Validadores para Motor de Causación y Prorrateo
 */
export const simularProrrateoValidator = vine.create({
  montoPeriodo: vine.number().positive().min(0.01),
  diasActivos: vine.number().min(0),
  diasPeriodo: vine.number().positive().min(1),
})

export const generarCausacionLoteValidator = vine.create({
  proyectoId: vine.number().positive(),
  grupoPagoId: vine.number().positive().nullable().optional(),
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
  proyectoId: vine.number().positive(),
  grupoPagoId: vine.number().positive().nullable().optional(),
  periodoInicio: isoDateString(),
  periodoFin: isoDateString(),
  deudaIds: vine.array(vine.number().positive()).optional(),
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
  proyectoId: vine.number().positive(),
  cajaOrigenId: vine.number().positive().nullable().optional(),
  anio: vine.number().min(2020).max(2100),
  mes: vine.number().min(1).max(12),
  montoAsignado: vine.number().min(0),
})

export const solicitarValeCajaValidator = vine.create({
  solicitantePersonaId: vine.number().positive(),
  montoSolicitado: vine.number().positive().min(0.01),
  concepto: vine.string().trim().minLength(3).maxLength(300),
})

export const rendirValeCajaValidator = vine.create({
  montoRendido: vine.number().min(0),
  comprobanteReferencia: vine.string().trim().minLength(2).maxLength(150),
})
