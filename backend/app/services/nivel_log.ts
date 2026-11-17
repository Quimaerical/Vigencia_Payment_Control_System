/**
 * Niveles de pino que acepta LOG_LEVEL (B4, ADR 0020).
 */
export const NIVELES_LOG = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const

export type NivelLog = (typeof NIVELES_LOG)[number]

/**
 * Lista blanca de producción: debug y trace filtran consultas y cuerpos; silent apaga los
 * warn de seguridad (denegaciones y límites, ADR 0016 y 0018).
 */
const NIVELES_PRODUCCION: readonly NivelLog[] = ['fatal', 'error', 'warn', 'info']

/**
 * Lanza un error, y con él aborta el arranque, si el nivel no está permitido en producción.
 */
export function validarNivelLog(entorno: string, nivel: NivelLog): void {
  if (entorno === 'production' && !NIVELES_PRODUCCION.includes(nivel)) {
    throw new Error(
      `LOG_LEVEL=${nivel} no está permitido en producción. Usa uno de: ${NIVELES_PRODUCCION.join(', ')}`
    )
  }
}
