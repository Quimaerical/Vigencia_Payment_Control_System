import Usuario from '#models/usuario'
import { loginValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'

export default class SesionesController {
  /**
   * Inicia sesión autenticando credenciales de usuario y emitiendo un Bearer token
   */
  async login({ request, serialize }: HttpContext) {
    const { username, password } = await request.validateUsing(loginValidator)

    const user = await Usuario.verifyCredentials(username, password)
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
