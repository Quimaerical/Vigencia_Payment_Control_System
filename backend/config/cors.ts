import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Orígenes permitidos estáticos para desarrollo local
 */
const localOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]

/**
 * Orígenes configurados vía variables de entorno (separados por coma)
 */
const configuredOrigins = env.get('CORS_ALLOWED_ORIGINS')
  ? env.get('CORS_ALLOWED_ORIGINS')!.split(',').map((o) => o.trim()).filter(Boolean)
  : []

/**
 * Hostname opcional del túnel de Cloudflare
 */
const tunnelHostname = env.get('TUNNEL_HOSTNAME')
  ? [`https://${env.get('TUNNEL_HOSTNAME')}`]
  : []

const allowedOriginsList = [...localOrigins, ...configuredOrigins, ...tunnelHostname]

/**
 * Configuration options to tweak the CORS policy.
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * Validador dinámico de origen:
   * 1. Si no hay origen (peticiones server-to-server o CLI), se permite.
   * 2. Permite localhost, dominios del túnel y orígenes en allowlist.
   * 3. Permite cualquier subdominio de Vercel (*.vercel.app) para soporte de Preview Deployments.
   */
  origin: (requestOrigin) => {
    if (!requestOrigin) {
      return true
    }

    if (allowedOriginsList.includes(requestOrigin)) {
      return true
    }

    // Acepta vistas previas y despliegues de producción en Vercel
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(requestOrigin)) {
      return true
    }

    return false
  },

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  /**
   * Request headers allowed.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: ['Content-Range', 'X-Total-Count', 'Authorization'],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
