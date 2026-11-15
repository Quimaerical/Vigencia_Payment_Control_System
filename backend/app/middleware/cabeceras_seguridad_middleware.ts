import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * CSP de una API que solo responde JSON: no carga recursos ni se deja enmarcar (B3, ADR 0020).
 */
const POLITICA_CONTENIDO = "default-src 'none'; frame-ancestors 'none'"

/**
 * Cabeceras de seguridad para toda respuesta del backend, también 401, 403, 404 y 429.
 * Va en `server.use` porque shield es router middleware y no corre en rutas inexistentes.
 */
export default class CabecerasSeguridadMiddleware {
  /**
   * Fija CSP y Referrer-Policy antes de seguir, para que las respuestas de error las lleven.
   */
  handle({ response }: HttpContext, next: NextFn) {
    response.header('Content-Security-Policy', POLITICA_CONTENIDO)
    response.header('Referrer-Policy', 'no-referrer')
    return next()
  }
}
