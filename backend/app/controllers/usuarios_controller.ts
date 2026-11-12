import Usuario from '#models/usuario'
import { signupValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'
import { RolUsuario } from '@app/shared'

export default class UsuariosController {
  /**
   * Registro público de nuevos usuarios asignando de forma segura el rol 'generador'
   */
  async registro({ request, serialize }: HttpContext) {
    const { username, password } = await request.validateUsing(signupValidator)

    const user = await Usuario.create({
      username,
      passwordHash: password,
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })
    const token = await Usuario.accessTokens.create(user)

    return serialize({
      user: UsuarioTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  /**
   * Retorna los datos del perfil del usuario autenticado actual
   */
  async perfil({ auth, serialize }: HttpContext) {
    return serialize(UsuarioTransformer.transform(auth.getUserOrFail()))
  }
}
