import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import limiter from '@adonisjs/limiter/services/main'
import { errors as limiterErrors } from '@adonisjs/limiter'

/**
 * Límites por IP (ADR 0018). `login` frena la fuerza bruta y el *password spraying* desde una
 * misma máquina (cuenta todos los intentos, no solo los fallidos); `api` es un tope suave
 * contra el abuso general de `/api/v1`, aplicado antes de autenticar para cubrir también la
 * adivinación de tokens. El límite por usuario + IP del login sigue en el controlador (ADR 0004).
 */
export const LIMITES_POR_IP = {
  login: {
    requests: 20,
    duration: '1 min',
    blockDuration: '15 mins',
    codigo: 'DEMASIADOS_INTENTOS',
    mensaje:
      'Demasiados intentos de inicio de sesión desde esta red. Espere antes de volver a intentarlo.',
  },
  api: {
    requests: 600,
    duration: '1 min',
    codigo: 'DEMASIADAS_PETICIONES',
    mensaje: 'Demasiadas peticiones desde esta red. Espere antes de volver a intentarlo.',
  },
} as const

export type AmbitoLimite = keyof typeof LIMITES_POR_IP

export default class LimitePeticionesMiddleware {
  /**
   * Consume una petición del contador `<ámbito>_ip:<ip>` en el store por defecto del
   * limitador. Si se supera (o la IP está bloqueada) responde 429 con `Retry-After` y el
   * formato del equipo, y deja un `warn` estructurado sin cuerpo ni cabeceras.
   */
  async handle(ctx: HttpContext, next: NextFn, options: { ambito: AmbitoLimite }) {
    const { codigo, mensaje, ...opciones } = LIMITES_POR_IP[options.ambito]
    const ip = ctx.request.ip()

    try {
      await limiter.use(opciones).consume(`${options.ambito}_ip:${ip}`)
    } catch (error) {
      if (!(error instanceof limiterErrors.E_TOO_MANY_REQUESTS)) {
        throw error
      }

      const reintentarEn = error.response.availableIn
      ctx.logger.warn(
        {
          evento: 'limite_superado',
          ambito: options.ambito,
          ip,
          metodo: ctx.request.method(),
          ruta: ctx.route?.pattern ?? null,
          reintentarEn,
        },
        'Límite de peticiones por IP superado'
      )
      ctx.response.header('Retry-After', String(reintentarEn))
      return ctx.response.status(429).json({ codigo, mensaje, reintentarEn })
    }

    return next()
  }
}
