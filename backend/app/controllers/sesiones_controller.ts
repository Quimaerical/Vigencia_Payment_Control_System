import Usuario from '#models/usuario'
import { loginValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'
import limiter from '@adonisjs/limiter/services/main'

export default class SesionesController {
  /**
   * Inicia sesión autenticando credenciales de usuario y emitiendo un Bearer token.
   * Limita los intentos fallidos por usuario + IP (ADR 0004): 5 fallos en 15 minutos
   * bloquean 15 minutos y un login correcto reinicia el contador.
   */
  async login({ request, response, serialize }: HttpContext) {
    const { username, password } = await request.validateUsing(loginValidator)

    const limiteLogin = limiter.use({
      requests: 5,
      duration: '15 mins',
      blockDuration: '15 mins',
    })
    const clave = `login:${username.toLowerCase()}:${request.ip()}`

    const [errorLimite, user] = await limiteLogin.penalize(clave, () =>
      Usuario.verifyCredentials(username, password)
    )

    if (errorLimite) {
      const reintentarEn = errorLimite.response.availableIn
      response.header('Retry-After', String(reintentarEn))
      return response.status(429).json({
        codigo: 'DEMASIADOS_INTENTOS',
        mensaje:
          'Demasiados intentos fallidos de inicio de sesión. Espere antes de volver a intentarlo.',
        reintentarEn,
      })
    }

    if (!user.estaActivo) {
      return response.status(403).json({
        codigo: 'USUARIO_INACTIVO',
        mensaje: 'La cuenta de usuario se encuentra desactivada por el Administrador del Sistema.',
      })
    }

    const token = await Usuario.accessTokens.create(user)

    return serialize({
      user: UsuarioTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  /**
   * Cierra la sesión activa revocando el token de acceso actual en base de datos
   */
  async logout({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await Usuario.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Sesión cerrada exitosamente',
    }
  }
}
