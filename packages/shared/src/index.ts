export enum RolUsuario {
  ADMINISTRADOR = 'administrador',
  GENERADOR = 'generador',
  RECEPTOR = 'receptor',
}

export enum EstadoSolicitud {
  CREACION = 'creacion',
  ENVIO = 'envio',
  APROBACION = 'aprobacion',
  ENTREGA = 'entrega',
  CIERRE = 'cierre',
}

export enum MetodoPago {
  TRANSFERENCIA = 'transferencia',
  EFECTIVO = 'efectivo',
  PAGO_MOVIL = 'pago_movil',
  ZELLE = 'zelle',
  OTRO = 'otro',
}

export enum EstadoDeuda {
  PENDIENTE = 'pendiente',
  LIQUIDADA = 'liquidada',
  ANULADA = 'anulada',
}

export enum EstadoPago {
  PROCESADO = 'procesado',
  ANULADO = 'anulado',
}
