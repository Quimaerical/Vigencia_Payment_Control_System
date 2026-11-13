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

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('registro', [UsuariosController, 'registro']).as('auth.registro')
        router.post('signup', [UsuariosController, 'registro']).as('auth.signup')
        router.post('login', [SesionesController, 'login']).as('auth.login')
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
        router.post('pagos', [PagosController, 'procesarPago']).as('pagos.procesar')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
