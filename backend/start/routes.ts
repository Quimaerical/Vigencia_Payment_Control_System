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
        router.post('registro', [UsuariosController, 'registro'])
        router.post('signup', [UsuariosController, 'registro'])
        router.post('login', [SesionesController, 'login'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('perfil', [UsuariosController, 'perfil'])
        router.get('profile', [UsuariosController, 'perfil'])
        router.post('logout', [SesionesController, 'logout'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.post('pagos', [PagosController, 'procesarPago'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
