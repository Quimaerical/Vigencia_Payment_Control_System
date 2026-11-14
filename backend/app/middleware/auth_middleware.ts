import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated or deactivated users.
 * El contexto de sesión PostgreSQL (`app.current_user_id`, `app.current_ip`)
 * se propaga exclusivamente mediante `set_config(..., true)` (is_local = true)
 * dentro de cada transacción ACID en `ejecutarTransaccionFinanciera()`.
 */
export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const usuario = await ctx.auth.authenticateUsing(options.guards)

    if (!usuario.estaActivo) {
      return ctx.response.status(403).json({
        codigo: 'USUARIO_INACTIVO',
        mensaje: 'La cuenta de usuario se encuentra desactivada por el Administrador del Sistema.',
      })
    }

    return next()
  }
}
