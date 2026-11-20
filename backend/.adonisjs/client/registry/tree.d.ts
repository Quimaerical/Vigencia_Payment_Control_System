/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    login: typeof routes['auth.login']
  }
  account: {
    perfil: typeof routes['account.perfil']
    profile: typeof routes['account.profile']
    logout: typeof routes['account.logout']
  }
  usuarios: {
    listar: typeof routes['usuarios.listar']
    crear: typeof routes['usuarios.crear']
    estado: typeof routes['usuarios.estado']
  }
  personas: {
    listar: typeof routes['personas.listar']
    crear: typeof routes['personas.crear']
    actualizar: typeof routes['personas.actualizar']
    estado: typeof routes['personas.estado']
  }
  proyectos: {
    listar: typeof routes['proyectos.listar']
    crear: typeof routes['proyectos.crear']
    actualizar: typeof routes['proyectos.actualizar']
    estado: typeof routes['proyectos.estado']
  }
  gruposPago: {
    listar: typeof routes['grupos_pago.listar']
    crear: typeof routes['grupos_pago.crear']
    actualizar: typeof routes['grupos_pago.actualizar']
    estado: typeof routes['grupos_pago.estado']
  }
  asignaciones: {
    listar: typeof routes['asignaciones.listar']
    crear: typeof routes['asignaciones.crear']
    actualizar: typeof routes['asignaciones.actualizar']
    estado: typeof routes['asignaciones.estado']
  }
  causaciones: {
    listar: typeof routes['causaciones.listar']
    simular: typeof routes['causaciones.simular']
    lote: typeof routes['causaciones.lote']
    anular: typeof routes['causaciones.anular']
  }
  deudas: {
    listar: typeof routes['deudas.listar']
    anular: typeof routes['deudas.anular']
  }
  solicitudesPago: {
    listar: typeof routes['solicitudes_pago.listar']
    mostrar: typeof routes['solicitudes_pago.mostrar']
    crear: typeof routes['solicitudes_pago.crear']
    enviar: typeof routes['solicitudes_pago.enviar']
    aprobar: typeof routes['solicitudes_pago.aprobar']
    rechazar: typeof routes['solicitudes_pago.rechazar']
    cerrar: typeof routes['solicitudes_pago.cerrar']
  }
  pagos: {
    listar: typeof routes['pagos.listar']
    procesar: typeof routes['pagos.procesar']
    anular: typeof routes['pagos.anular']
  }
  cajasChicas: {
    listar: typeof routes['cajas_chicas.listar']
    mostrar: typeof routes['cajas_chicas.mostrar']
    abrir: typeof routes['cajas_chicas.abrir']
    cerrar: typeof routes['cajas_chicas.cerrar']
    solicitarVale: typeof routes['cajas_chicas.solicitar_vale']
  }
  valesCaja: {
    aprobar: typeof routes['vales_caja.aprobar']
    rechazar: typeof routes['vales_caja.rechazar']
    desembolsar: typeof routes['vales_caja.desembolsar']
    rendir: typeof routes['vales_caja.rendir']
    anular: typeof routes['vales_caja.anular']
  }
  reportes: {
    resumen: typeof routes['reportes.resumen']
    reciboPagoPdf: typeof routes['reportes.recibo_pago_pdf']
    solicitudConsolidadaPdf: typeof routes['reportes.solicitud_consolidada_pdf']
  }
  auditLogs: {
    listar: typeof routes['audit_logs.listar']
  }
}
