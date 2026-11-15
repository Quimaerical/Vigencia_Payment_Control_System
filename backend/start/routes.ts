/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const PagosController = () => import('#controllers/pagos_controller')
const SesionesController = () => import('#controllers/sesiones_controller')
const UsuariosController = () => import('#controllers/usuarios_controller')
const PersonasController = () => import('#controllers/personas_controller')
const ProyectosController = () => import('#controllers/proyectos_controller')
const GruposPagoController = () => import('#controllers/grupos_pago_controller')
const AsignacionesController = () => import('#controllers/asignaciones_controller')
const CausacionesController = () => import('#controllers/causaciones_controller')
const SolicitudesPagoController = () => import('#controllers/solicitudes_pago_controller')
const CajasChicasController = () => import('#controllers/cajas_chicas_controller')
const ReportesController = () => import('#controllers/reportes_controller')

/**
 * Id de ruta: entero positivo de 1 a 9 dígitos, sin ceros a la izquierda (cabe en INTEGER).
 * Cualquier otro valor no casa con la ruta → 404 sin llegar a PostgreSQL (M1, ADR 0015).
 */
const idNumerico = { match: /^[1-9]\d{0,8}$/, cast: (valor: string) => Number(valor) }

router.get('/', () => {
  return { hello: 'world' }
})

/** Todo /api/v1 pasa por el límite general por IP antes de autenticar (M4, ADR 0018). */
router
  .group(() => {
    router
      .group(() => {
        router
          .post('login', [SesionesController, 'login'])
          .as('auth.login')
          .use(middleware.limitePeticiones({ ambito: 'login' }))
      })
      .prefix('auth')

    router
      .group(() => {
        router.get('perfil', [UsuariosController, 'perfil']).as('account.perfil')
        router.get('profile', [UsuariosController, 'perfil']).as('account.profile')
        router.post('logout', [SesionesController, 'logout']).as('account.logout')
      })
      .prefix('account')
      .use(middleware.auth())

    router
      .group(() => {
        // 2.1 Gestión de Catálogos y Usuarios
        router.get('usuarios', [UsuariosController, 'listar']).as('usuarios.listar')
        router.post('usuarios', [UsuariosController, 'crear']).as('usuarios.crear')
        router
          .patch('usuarios/:id/estado', [UsuariosController, 'cambiarEstado'])
          .as('usuarios.estado')

        router.get('personas', [PersonasController, 'listar']).as('personas.listar')
        router.post('personas', [PersonasController, 'crear']).as('personas.crear')
        router.put('personas/:id', [PersonasController, 'actualizar']).as('personas.actualizar')
        router
          .patch('personas/:id/estado', [PersonasController, 'cambiarEstado'])
          .as('personas.estado')

        router.get('proyectos', [ProyectosController, 'listar']).as('proyectos.listar')
        router.post('proyectos', [ProyectosController, 'crear']).as('proyectos.crear')
        router.put('proyectos/:id', [ProyectosController, 'actualizar']).as('proyectos.actualizar')
        router
          .patch('proyectos/:id/estado', [ProyectosController, 'cambiarEstado'])
          .as('proyectos.estado')

        router.get('grupos-pago', [GruposPagoController, 'listar']).as('grupos_pago.listar')
        router.post('grupos-pago', [GruposPagoController, 'crear']).as('grupos_pago.crear')
        router
          .put('grupos-pago/:id', [GruposPagoController, 'actualizar'])
          .as('grupos_pago.actualizar')
        router
          .patch('grupos-pago/:id/estado', [GruposPagoController, 'cambiarEstado'])
          .as('grupos_pago.estado')

        router.get('asignaciones', [AsignacionesController, 'listar']).as('asignaciones.listar')
        router.post('asignaciones', [AsignacionesController, 'crear']).as('asignaciones.crear')
        router
          .put('asignaciones/:id', [AsignacionesController, 'actualizar'])
          .as('asignaciones.actualizar')
        router
          .patch('asignaciones/:id/estado', [AsignacionesController, 'cambiarEstado'])
          .as('asignaciones.estado')

        // 2.2 Motor de Causación y Prorrateo
        router.get('causaciones', [CausacionesController, 'listar']).as('causaciones.listar')
        router.get('deudas', [CausacionesController, 'listar']).as('deudas.listar')
        router
          .post('causaciones/simular', [CausacionesController, 'simular'])
          .as('causaciones.simular')
        router
          .post('causaciones/lote', [CausacionesController, 'generarLote'])
          .as('causaciones.lote')
        router
          .post('causaciones/:id/anular', [CausacionesController, 'anular'])
          .as('causaciones.anular')
        router.post('deudas/:id/anular', [CausacionesController, 'anular']).as('deudas.anular')

        // 2.3 Ciclo de Solicitudes y Pagos
        router
          .get('solicitudes-pago', [SolicitudesPagoController, 'listar'])
          .as('solicitudes_pago.listar')
        router
          .get('solicitudes-pago/:id', [SolicitudesPagoController, 'mostrar'])
          .as('solicitudes_pago.mostrar')
        router
          .post('solicitudes-pago', [SolicitudesPagoController, 'crear'])
          .as('solicitudes_pago.crear')
        router
          .patch('solicitudes-pago/:id/enviar', [SolicitudesPagoController, 'enviar'])
          .as('solicitudes_pago.enviar')
        router
          .patch('solicitudes-pago/:id/aprobar', [SolicitudesPagoController, 'aprobar'])
          .as('solicitudes_pago.aprobar')
        router
          .patch('solicitudes-pago/:id/rechazar', [SolicitudesPagoController, 'rechazar'])
          .as('solicitudes_pago.rechazar')
        router
          .patch('solicitudes-pago/:id/cerrar', [SolicitudesPagoController, 'cerrar'])
          .as('solicitudes_pago.cerrar')

        router.get('pagos', [PagosController, 'listar']).as('pagos.listar')
        router.post('pagos', [PagosController, 'procesarPago']).as('pagos.procesar')
        router.post('pagos/:id/anular', [PagosController, 'anularPago']).as('pagos.anular')

        // 2.4 Control de Cajas Chicas y Vales
        router.get('cajas-chicas', [CajasChicasController, 'listar']).as('cajas_chicas.listar')
        router
          .get('cajas-chicas/:id', [CajasChicasController, 'mostrar'])
          .as('cajas_chicas.mostrar')
        router.post('cajas-chicas', [CajasChicasController, 'abrir']).as('cajas_chicas.abrir')
        router
          .patch('cajas-chicas/:id/cerrar', [CajasChicasController, 'cerrar'])
          .as('cajas_chicas.cerrar')
        router
          .post('cajas-chicas/:id/vales', [CajasChicasController, 'solicitarVale'])
          .as('cajas_chicas.solicitar_vale')
        router
          .patch('vales-caja/:id/aprobar', [CajasChicasController, 'aprobarVale'])
          .as('vales_caja.aprobar')
        router
          .patch('vales-caja/:id/rechazar', [CajasChicasController, 'rechazarVale'])
          .as('vales_caja.rechazar')
        router
          .patch('vales-caja/:id/desembolsar', [CajasChicasController, 'desembolsarVale'])
          .as('vales_caja.desembolsar')
        router
          .patch('vales-caja/:id/rendir', [CajasChicasController, 'rendirVale'])
          .as('vales_caja.rendir')
        router
          .post('vales-caja/:id/anular', [CajasChicasController, 'anularVale'])
          .as('vales_caja.anular')

        // 2.5 Reportes, Documentos PDF y Auditoría
        router.get('reportes/resumen', [ReportesController, 'resumen']).as('reportes.resumen')
        router
          .get('reportes/pagos/:id/recibo.pdf', [ReportesController, 'reciboPagoPdf'])
          .as('reportes.recibo_pago_pdf')
        router
          .get('reportes/solicitudes/:id/consolidado.pdf', [
            ReportesController,
            'solicitudConsolidadaPdf',
          ])
          .as('reportes.solicitud_consolidada_pdf')
        router.get('audit-logs', [ReportesController, 'auditLogs']).as('audit_logs.listar')
      })
      .where('id', idNumerico)
      .use(middleware.auth())
  })
  .prefix('/api/v1')
  .use(middleware.limitePeticiones({ ambito: 'api' }))
