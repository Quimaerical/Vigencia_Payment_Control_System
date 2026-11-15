import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Formato permitido para el nombre del proyecto y el slug del equipo en Vercel (ADR 0013).
 * Solo minúsculas, dígitos y guiones internos, así se interpolan en la regex sin escapar.
 */
const SEGMENTO_VERCEL = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Orígenes de desarrollo local. Nunca se aceptan en producción (ADR 0005).
 */
const origenesLocales =
  env.get('NODE_ENV') === 'production'
    ? []
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ]

/**
 * Orígenes exactos configurados en CORS_ALLOWED_ORIGINS (separados por coma).
 */
const origenesConfigurados = (env.get('CORS_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean)

const origenesExactos = new Set([...origenesLocales, ...origenesConfigurados])

/**
 * Construye la regex de previews de Vercel del proyecto, anclada al nombre del proyecto y al
 * slug del equipo (ADR 0013). Sin ambas variables no se acepta ningún preview. Si alguna
 * tiene un formato inválido se lanza un error y el backend no arranca (fallar cerrado).
 */
function construirRegexPreviews(): RegExp | null {
  const prefijo = env.get('CORS_VERCEL_PREVIEW_PREFIX')
  const slugEquipo = env.get('CORS_VERCEL_TEAM_SLUG')

  if (!prefijo || !slugEquipo) {
    return null
  }

  if (!SEGMENTO_VERCEL.test(prefijo) || !SEGMENTO_VERCEL.test(slugEquipo)) {
    throw new Error(
      'CORS_VERCEL_PREVIEW_PREFIX y CORS_VERCEL_TEAM_SLUG solo admiten minúsculas, dígitos y guiones internos (ADR 0013)'
    )
  }

  return new RegExp(`^https://${prefijo}-[a-z0-9-]+-${slugEquipo}\\.vercel\\.app$`)
}

const regexPreviews = construirRegexPreviews()

/**
 * Política CORS (ADR 0005 y 0013). La API autentica con Bearer, no con cookies, así que no
 * se envían credenciales. CORS no es el control de acceso: lo es el guard `api`.
 */
const corsConfig = defineConfig({
  enabled: true,

  /**
   * Decide si un origen puede leer las respuestas:
   * 1. Sin cabecera Origin (curl, servidor a servidor): se permite.
   * 2. Origen exacto de la lista (locales fuera de producción + CORS_ALLOWED_ORIGINS).
   * 3. Preview de Vercel de este proyecto y este equipo, si están configurados.
   */
  origin: (origenPeticion) => {
    if (!origenPeticion) {
      return true
    }

    if (origenesExactos.has(origenPeticion)) {
      return true
    }

    return regexPreviews !== null && regexPreviews.test(origenPeticion)
  },

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  headers: true,

  /**
   * Cabeceras de respuesta legibles desde el navegador. Retry-After la envía el 429 del
   * login (ADR 0004) y no es una cabecera "safelisted".
   */
  exposeHeaders: ['Content-Range', 'X-Total-Count', 'Retry-After'],

  credentials: false,

  maxAge: 90,
})

export default corsConfig
