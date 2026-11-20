import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'usuarios.listar': { paramsTuple?: []; params?: {} }
    'usuarios.crear': { paramsTuple?: []; params?: {} }
    'usuarios.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'personas.listar': { paramsTuple?: []; params?: {} }
    'personas.crear': { paramsTuple?: []; params?: {} }
    'personas.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'personas.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'proyectos.listar': { paramsTuple?: []; params?: {} }
    'proyectos.crear': { paramsTuple?: []; params?: {} }
    'proyectos.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'proyectos.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'grupos_pago.listar': { paramsTuple?: []; params?: {} }
    'grupos_pago.crear': { paramsTuple?: []; params?: {} }
    'grupos_pago.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'grupos_pago.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'asignaciones.listar': { paramsTuple?: []; params?: {} }
    'asignaciones.crear': { paramsTuple?: []; params?: {} }
    'asignaciones.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'asignaciones.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'causaciones.listar': { paramsTuple?: []; params?: {} }
    'deudas.listar': { paramsTuple?: []; params?: {} }
    'causaciones.simular': { paramsTuple?: []; params?: {} }
    'causaciones.lote': { paramsTuple?: []; params?: {} }
    'causaciones.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deudas.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.listar': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.crear': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.enviar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.aprobar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.rechazar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.cerrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pagos.listar': { paramsTuple?: []; params?: {} }
    'pagos.procesar': { paramsTuple?: []; params?: {} }
    'pagos.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cajas_chicas.listar': { paramsTuple?: []; params?: {} }
    'cajas_chicas.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cajas_chicas.abrir': { paramsTuple?: []; params?: {} }
    'cajas_chicas.cerrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cajas_chicas.solicitar_vale': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.aprobar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.rechazar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.desembolsar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.rendir': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.resumen': { paramsTuple?: []; params?: {} }
    'reportes.recibo_pago_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.solicitud_consolidada_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audit_logs.listar': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'usuarios.listar': { paramsTuple?: []; params?: {} }
    'personas.listar': { paramsTuple?: []; params?: {} }
    'proyectos.listar': { paramsTuple?: []; params?: {} }
    'grupos_pago.listar': { paramsTuple?: []; params?: {} }
    'asignaciones.listar': { paramsTuple?: []; params?: {} }
    'causaciones.listar': { paramsTuple?: []; params?: {} }
    'deudas.listar': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.listar': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pagos.listar': { paramsTuple?: []; params?: {} }
    'cajas_chicas.listar': { paramsTuple?: []; params?: {} }
    'cajas_chicas.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.resumen': { paramsTuple?: []; params?: {} }
    'reportes.recibo_pago_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.solicitud_consolidada_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audit_logs.listar': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'usuarios.listar': { paramsTuple?: []; params?: {} }
    'personas.listar': { paramsTuple?: []; params?: {} }
    'proyectos.listar': { paramsTuple?: []; params?: {} }
    'grupos_pago.listar': { paramsTuple?: []; params?: {} }
    'asignaciones.listar': { paramsTuple?: []; params?: {} }
    'causaciones.listar': { paramsTuple?: []; params?: {} }
    'deudas.listar': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.listar': { paramsTuple?: []; params?: {} }
    'solicitudes_pago.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pagos.listar': { paramsTuple?: []; params?: {} }
    'cajas_chicas.listar': { paramsTuple?: []; params?: {} }
    'cajas_chicas.mostrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.resumen': { paramsTuple?: []; params?: {} }
    'reportes.recibo_pago_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.solicitud_consolidada_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audit_logs.listar': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'usuarios.crear': { paramsTuple?: []; params?: {} }
    'personas.crear': { paramsTuple?: []; params?: {} }
    'proyectos.crear': { paramsTuple?: []; params?: {} }
    'grupos_pago.crear': { paramsTuple?: []; params?: {} }
    'asignaciones.crear': { paramsTuple?: []; params?: {} }
    'causaciones.simular': { paramsTuple?: []; params?: {} }
    'causaciones.lote': { paramsTuple?: []; params?: {} }
    'causaciones.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deudas.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.crear': { paramsTuple?: []; params?: {} }
    'pagos.procesar': { paramsTuple?: []; params?: {} }
    'pagos.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cajas_chicas.abrir': { paramsTuple?: []; params?: {} }
    'cajas_chicas.solicitar_vale': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.anular': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'usuarios.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'personas.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'proyectos.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'grupos_pago.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'asignaciones.estado': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.enviar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.aprobar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.rechazar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes_pago.cerrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cajas_chicas.cerrar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.aprobar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.rechazar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.desembolsar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vales_caja.rendir': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'personas.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'proyectos.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'grupos_pago.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'asignaciones.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}