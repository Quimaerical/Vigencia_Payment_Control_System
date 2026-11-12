export const RolUsuario = {
  ADMINISTRADOR: 'administrador',
  GENERADOR: 'generador',
  RECEPTOR: 'receptor',
} as const
export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario]

export const EstadoSolicitud = {
  CREACION: 'creacion',
  ENVIO: 'envio',
  APROBACION: 'aprobacion',
  RECHAZADA: 'rechazada',
  ENTREGA: 'entrega',
  CIERRE: 'cierre',
} as const
export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud]

export const MetodoPago = {
  TRANSFERENCIA: 'transferencia',
  EFECTIVO: 'efectivo',
  PAGO_MOVIL: 'pago_movil',
  ZELLE: 'zelle',
  OTRO: 'otro',
} as const
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago]

export const EstadoDeuda = {
  PENDIENTE: 'pendiente',
  ABONADO: 'abonado',
  LIQUIDADA: 'liquidada',
  ANULADA: 'anulada',
} as const
export type EstadoDeuda = (typeof EstadoDeuda)[keyof typeof EstadoDeuda]

export const EstadoPago = {
  PROCESADO: 'procesado',
  ANULADO: 'anulado',
} as const
export type EstadoPago = (typeof EstadoPago)[keyof typeof EstadoPago]

export const AreaProyecto = {
  FISICA: 'fisica',
  QUIMICA: 'quimica',
  BIOLOGIA: 'biologia',
} as const
export type AreaProyecto = (typeof AreaProyecto)[keyof typeof AreaProyecto]

export const AmbitoProyecto = {
  INTERNO: 'interno',
  EXTERNO: 'externo',
} as const
export type AmbitoProyecto = (typeof AmbitoProyecto)[keyof typeof AmbitoProyecto]

export const PeriodicidadGrupoPago = {
  SEMANAL: 'semanal',
  QUINCENAL: 'quincenal',
  MENSUAL: 'mensual',
} as const
export type PeriodicidadGrupoPago =
  (typeof PeriodicidadGrupoPago)[keyof typeof PeriodicidadGrupoPago]

export const EstadoCajaChica = {
  ABIERTA: 'abierta',
  CERRADA: 'cerrada',
} as const
export type EstadoCajaChica = (typeof EstadoCajaChica)[keyof typeof EstadoCajaChica]

export const EstadoValeCaja = {
  SOLICITADO: 'solicitado',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  DESEMBOLSADO: 'desembolsado',
  RENDIDO: 'rendido',
  ANULADO: 'anulado',
} as const
export type EstadoValeCaja = (typeof EstadoValeCaja)[keyof typeof EstadoValeCaja]
