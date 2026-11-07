import Usuario from '#models/usuario'
import { signupValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { username, password, rol } = await request.validateUsing(signupValidator)

    const user = await Usuario.create({
      username,
      passwordHash: password,
      rol: rol ?? 'generador',
      estaActivo: true,
    })
    const token = await Usuario.accessTokens.create(user)

    return serialize({
      user: UsuarioTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
