import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import db from '@adonisjs/lucid/services/db'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 * Además propaga el usuario autenticado y la IP al contexto de sesión
 * de PostgreSQL para que los triggers RBAC y de auditoría forense
 * dispongan siempre de trazabilidad de sesión en todas las rutas protegidas.
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
    const esPostgres = db.connection().dialect.name === 'postgres'

    if (esPostgres && usuario) {
      await db.rawQuery(`SELECT set_config('app.current_user_id', ?, false)`, [String(usuario.id)])
      await db.rawQuery(`SELECT set_config('app.current_ip', ?, false)`, [ctx.request.ip()])
    }

    try {
      return await next()
    } finally {
      if (esPostgres && usuario) {
        await db.rawQuery(`SELECT set_config('app.current_user_id', '', false)`)
        await db.rawQuery(`SELECT set_config('app.current_ip', '', false)`)
      }
    }
  }
}
