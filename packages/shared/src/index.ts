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
  LIQUIDADA: 'liquidada',
  ANULADA: 'anulada',
} as const
export type EstadoDeuda = (typeof EstadoDeuda)[keyof typeof EstadoDeuda]

export const EstadoPago = {
  PROCESADO: 'procesado',
  ANULADO: 'anulado',
} as const
export type EstadoPago = (typeof EstadoPago)[keyof typeof EstadoPago]
