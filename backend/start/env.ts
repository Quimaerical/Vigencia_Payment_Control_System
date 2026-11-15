/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'
import { NIVELES_LOG, validarNivelLog } from '#services/nivel_log'

const env = await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  // Niveles de pino; en producción solo fatal/error/warn/info (B4, ADR 0020)
  LOG_LEVEL: Env.schema.enum(NIVELES_LOG),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database
  DB_CONNECTION: Env.schema.string.optional(),
  DATABASE_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),
  DB_SSL: Env.schema.boolean.optional(),

  // CORS & Networking
  CORS_ALLOWED_ORIGINS: Env.schema.string.optional(),
  TUNNEL_HOSTNAME: Env.schema.string.optional(),
  CORS_VERCEL_PREVIEW_PREFIX: Env.schema.string.optional(),
  CORS_VERCEL_TEAM_SLUG: Env.schema.string.optional(),
  TRUSTED_PROXIES: Env.schema.string.optional(),

  // Límite de intentos (ADR 0004): database en desarrollo/producción, memory en pruebas
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),
})

/**
 * Aborta el arranque con debug, trace o silent en producción (B4, ADR 0020).
 */
validarNivelLog(env.get('NODE_ENV'), env.get('LOG_LEVEL'))

export default env
