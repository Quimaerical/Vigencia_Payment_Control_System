/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.login']['types'],
  },
  'account.perfil': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/perfil',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"perfil"]],
    types: placeholder as Registry['account.perfil']['types'],
  },
  'account.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['account.profile']['types'],
  },
  'account.logout': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['account.logout']['types'],
  },
  'usuarios.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/usuarios',
    tokens: [[0,"api"],[0,"v1"],[0,"usuarios"]],
    types: placeholder as Registry['usuarios.listar']['types'],
  },
  'usuarios.crear': {
    methods: ["POST"],
    pattern: '/api/v1/usuarios',
    tokens: [[0,"api"],[0,"v1"],[0,"usuarios"]],
    types: placeholder as Registry['usuarios.crear']['types'],
  },
  'usuarios.estado': {
    methods: ["PATCH"],
    pattern: '/api/v1/usuarios/:id/estado',
    tokens: [[0,"api"],[0,"v1"],[0,"usuarios"],[1,"id"],[0,"estado"]],
    types: placeholder as Registry['usuarios.estado']['types'],
  },
  'personas.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/personas',
    tokens: [[0,"api"],[0,"v1"],[0,"personas"]],
    types: placeholder as Registry['personas.listar']['types'],
  },
  'personas.crear': {
    methods: ["POST"],
    pattern: '/api/v1/personas',
    tokens: [[0,"api"],[0,"v1"],[0,"personas"]],
    types: placeholder as Registry['personas.crear']['types'],
  },
  'personas.actualizar': {
    methods: ["PUT"],
    pattern: '/api/v1/personas/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"personas"],[1,"id"]],
    types: placeholder as Registry['personas.actualizar']['types'],
  },
  'personas.estado': {
    methods: ["PATCH"],
    pattern: '/api/v1/personas/:id/estado',
    tokens: [[0,"api"],[0,"v1"],[0,"personas"],[1,"id"],[0,"estado"]],
    types: placeholder as Registry['personas.estado']['types'],
  },
  'proyectos.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/proyectos',
    tokens: [[0,"api"],[0,"v1"],[0,"proyectos"]],
    types: placeholder as Registry['proyectos.listar']['types'],
  },
  'proyectos.crear': {
    methods: ["POST"],
    pattern: '/api/v1/proyectos',
    tokens: [[0,"api"],[0,"v1"],[0,"proyectos"]],
    types: placeholder as Registry['proyectos.crear']['types'],
  },
  'proyectos.actualizar': {
    methods: ["PUT"],
    pattern: '/api/v1/proyectos/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"proyectos"],[1,"id"]],
    types: placeholder as Registry['proyectos.actualizar']['types'],
  },
  'proyectos.estado': {
    methods: ["PATCH"],
    pattern: '/api/v1/proyectos/:id/estado',
    tokens: [[0,"api"],[0,"v1"],[0,"proyectos"],[1,"id"],[0,"estado"]],
    types: placeholder as Registry['proyectos.estado']['types'],
  },
  'grupos_pago.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/grupos-pago',
    tokens: [[0,"api"],[0,"v1"],[0,"grupos-pago"]],
    types: placeholder as Registry['grupos_pago.listar']['types'],
  },
  'grupos_pago.crear': {
    methods: ["POST"],
    pattern: '/api/v1/grupos-pago',
    tokens: [[0,"api"],[0,"v1"],[0,"grupos-pago"]],
    types: placeholder as Registry['grupos_pago.crear']['types'],
  },
  'grupos_pago.actualizar': {
    methods: ["PUT"],
    pattern: '/api/v1/grupos-pago/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"grupos-pago"],[1,"id"]],
    types: placeholder as Registry['grupos_pago.actualizar']['types'],
  },
  'grupos_pago.estado': {
    methods: ["PATCH"],
    pattern: '/api/v1/grupos-pago/:id/estado',
    tokens: [[0,"api"],[0,"v1"],[0,"grupos-pago"],[1,"id"],[0,"estado"]],
    types: placeholder as Registry['grupos_pago.estado']['types'],
  },
  'asignaciones.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/asignaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"asignaciones"]],
    types: placeholder as Registry['asignaciones.listar']['types'],
  },
  'asignaciones.crear': {
    methods: ["POST"],
    pattern: '/api/v1/asignaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"asignaciones"]],
    types: placeholder as Registry['asignaciones.crear']['types'],
  },
  'asignaciones.actualizar': {
    methods: ["PUT"],
    pattern: '/api/v1/asignaciones/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"asignaciones"],[1,"id"]],
    types: placeholder as Registry['asignaciones.actualizar']['types'],
  },
  'asignaciones.estado': {
    methods: ["PATCH"],
    pattern: '/api/v1/asignaciones/:id/estado',
    tokens: [[0,"api"],[0,"v1"],[0,"asignaciones"],[1,"id"],[0,"estado"]],
    types: placeholder as Registry['asignaciones.estado']['types'],
  },
  'causaciones.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/causaciones',
    tokens: [[0,"api"],[0,"v1"],[0,"causaciones"]],
    types: placeholder as Registry['causaciones.listar']['types'],
  },
  'deudas.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/deudas',
    tokens: [[0,"api"],[0,"v1"],[0,"deudas"]],
    types: placeholder as Registry['deudas.listar']['types'],
  },
  'causaciones.simular': {
    methods: ["POST"],
    pattern: '/api/v1/causaciones/simular',
    tokens: [[0,"api"],[0,"v1"],[0,"causaciones"],[0,"simular"]],
    types: placeholder as Registry['causaciones.simular']['types'],
  },
  'causaciones.lote': {
    methods: ["POST"],
    pattern: '/api/v1/causaciones/lote',
    tokens: [[0,"api"],[0,"v1"],[0,"causaciones"],[0,"lote"]],
    types: placeholder as Registry['causaciones.lote']['types'],
  },
  'causaciones.anular': {
    methods: ["POST"],
    pattern: '/api/v1/causaciones/:id/anular',
    tokens: [[0,"api"],[0,"v1"],[0,"causaciones"],[1,"id"],[0,"anular"]],
    types: placeholder as Registry['causaciones.anular']['types'],
  },
  'deudas.anular': {
    methods: ["POST"],
    pattern: '/api/v1/deudas/:id/anular',
    tokens: [[0,"api"],[0,"v1"],[0,"deudas"],[1,"id"],[0,"anular"]],
    types: placeholder as Registry['deudas.anular']['types'],
  },
  'solicitudes_pago.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/solicitudes-pago',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"]],
    types: placeholder as Registry['solicitudes_pago.listar']['types'],
  },
  'solicitudes_pago.mostrar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/solicitudes-pago/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"],[1,"id"]],
    types: placeholder as Registry['solicitudes_pago.mostrar']['types'],
  },
  'solicitudes_pago.crear': {
    methods: ["POST"],
    pattern: '/api/v1/solicitudes-pago',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"]],
    types: placeholder as Registry['solicitudes_pago.crear']['types'],
  },
  'solicitudes_pago.enviar': {
    methods: ["PATCH"],
    pattern: '/api/v1/solicitudes-pago/:id/enviar',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"],[1,"id"],[0,"enviar"]],
    types: placeholder as Registry['solicitudes_pago.enviar']['types'],
  },
  'solicitudes_pago.aprobar': {
    methods: ["PATCH"],
    pattern: '/api/v1/solicitudes-pago/:id/aprobar',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"],[1,"id"],[0,"aprobar"]],
    types: placeholder as Registry['solicitudes_pago.aprobar']['types'],
  },
  'solicitudes_pago.rechazar': {
    methods: ["PATCH"],
    pattern: '/api/v1/solicitudes-pago/:id/rechazar',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"],[1,"id"],[0,"rechazar"]],
    types: placeholder as Registry['solicitudes_pago.rechazar']['types'],
  },
  'solicitudes_pago.cerrar': {
    methods: ["PATCH"],
    pattern: '/api/v1/solicitudes-pago/:id/cerrar',
    tokens: [[0,"api"],[0,"v1"],[0,"solicitudes-pago"],[1,"id"],[0,"cerrar"]],
    types: placeholder as Registry['solicitudes_pago.cerrar']['types'],
  },
  'pagos.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/pagos',
    tokens: [[0,"api"],[0,"v1"],[0,"pagos"]],
    types: placeholder as Registry['pagos.listar']['types'],
  },
  'pagos.procesar': {
    methods: ["POST"],
    pattern: '/api/v1/pagos',
    tokens: [[0,"api"],[0,"v1"],[0,"pagos"]],
    types: placeholder as Registry['pagos.procesar']['types'],
  },
  'pagos.anular': {
    methods: ["POST"],
    pattern: '/api/v1/pagos/:id/anular',
    tokens: [[0,"api"],[0,"v1"],[0,"pagos"],[1,"id"],[0,"anular"]],
    types: placeholder as Registry['pagos.anular']['types'],
  },
  'cajas_chicas.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/cajas-chicas',
    tokens: [[0,"api"],[0,"v1"],[0,"cajas-chicas"]],
    types: placeholder as Registry['cajas_chicas.listar']['types'],
  },
  'cajas_chicas.mostrar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/cajas-chicas/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"cajas-chicas"],[1,"id"]],
    types: placeholder as Registry['cajas_chicas.mostrar']['types'],
  },
  'cajas_chicas.abrir': {
    methods: ["POST"],
    pattern: '/api/v1/cajas-chicas',
    tokens: [[0,"api"],[0,"v1"],[0,"cajas-chicas"]],
    types: placeholder as Registry['cajas_chicas.abrir']['types'],
  },
  'cajas_chicas.cerrar': {
    methods: ["PATCH"],
    pattern: '/api/v1/cajas-chicas/:id/cerrar',
    tokens: [[0,"api"],[0,"v1"],[0,"cajas-chicas"],[1,"id"],[0,"cerrar"]],
    types: placeholder as Registry['cajas_chicas.cerrar']['types'],
  },
  'cajas_chicas.solicitar_vale': {
    methods: ["POST"],
    pattern: '/api/v1/cajas-chicas/:id/vales',
    tokens: [[0,"api"],[0,"v1"],[0,"cajas-chicas"],[1,"id"],[0,"vales"]],
    types: placeholder as Registry['cajas_chicas.solicitar_vale']['types'],
  },
  'vales_caja.aprobar': {
    methods: ["PATCH"],
    pattern: '/api/v1/vales-caja/:id/aprobar',
    tokens: [[0,"api"],[0,"v1"],[0,"vales-caja"],[1,"id"],[0,"aprobar"]],
    types: placeholder as Registry['vales_caja.aprobar']['types'],
  },
  'vales_caja.rechazar': {
    methods: ["PATCH"],
    pattern: '/api/v1/vales-caja/:id/rechazar',
    tokens: [[0,"api"],[0,"v1"],[0,"vales-caja"],[1,"id"],[0,"rechazar"]],
    types: placeholder as Registry['vales_caja.rechazar']['types'],
  },
  'vales_caja.desembolsar': {
    methods: ["PATCH"],
    pattern: '/api/v1/vales-caja/:id/desembolsar',
    tokens: [[0,"api"],[0,"v1"],[0,"vales-caja"],[1,"id"],[0,"desembolsar"]],
    types: placeholder as Registry['vales_caja.desembolsar']['types'],
  },
  'vales_caja.rendir': {
    methods: ["PATCH"],
    pattern: '/api/v1/vales-caja/:id/rendir',
    tokens: [[0,"api"],[0,"v1"],[0,"vales-caja"],[1,"id"],[0,"rendir"]],
    types: placeholder as Registry['vales_caja.rendir']['types'],
  },
  'vales_caja.anular': {
    methods: ["POST"],
    pattern: '/api/v1/vales-caja/:id/anular',
    tokens: [[0,"api"],[0,"v1"],[0,"vales-caja"],[1,"id"],[0,"anular"]],
    types: placeholder as Registry['vales_caja.anular']['types'],
  },
  'reportes.resumen': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/reportes/resumen',
    tokens: [[0,"api"],[0,"v1"],[0,"reportes"],[0,"resumen"]],
    types: placeholder as Registry['reportes.resumen']['types'],
  },
  'reportes.recibo_pago_pdf': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/reportes/pagos/:id/recibo.pdf',
    tokens: [[0,"api"],[0,"v1"],[0,"reportes"],[0,"pagos"],[1,"id"],[0,"recibo.pdf"]],
    types: placeholder as Registry['reportes.recibo_pago_pdf']['types'],
  },
  'reportes.solicitud_consolidada_pdf': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/reportes/solicitudes/:id/consolidado.pdf',
    tokens: [[0,"api"],[0,"v1"],[0,"reportes"],[0,"solicitudes"],[1,"id"],[0,"consolidado.pdf"]],
    types: placeholder as Registry['reportes.solicitud_consolidada_pdf']['types'],
  },
  'audit_logs.listar': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/audit-logs',
    tokens: [[0,"api"],[0,"v1"],[0,"audit-logs"]],
    types: placeholder as Registry['audit_logs.listar']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
