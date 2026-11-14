import Usuario from '#models/usuario'
import {
  signupValidator,
  crearUsuarioAdminValidator,
  cambiarEstadoActivoValidator,
} from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'
import { RolUsuario } from '@app/shared'
import { esAdministrador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

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

  /**
   * Lista todos los usuarios del sistema (restringido a rol 'administrador')
   */
  async listar({ auth, bouncer, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const usuarios = await Usuario.query().orderBy('id', 'asc')
    return response.status(200).json({ data: usuarios })
  }

  /**
   * Crea un nuevo usuario con rol explícito (restringido a rol 'administrador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const payload = await request.validateUsing(crearUsuarioAdminValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const usuario = new Usuario()
      usuario.username = payload.username
      usuario.passwordHash = payload.password
      usuario.rol = payload.rol
      usuario.estaActivo = payload.estaActivo ?? true
      usuario.useTransaction(trx)
      await usuario.save()

      return response.status(201).json({
        mensaje: 'Usuario creado exitosamente por el Administrador',
        data: usuario,
      })
    })
  }

  /**
   * Activa o desactiva lógicamente a un usuario (baja lógica que preserva audit_logs)
   */
  async cambiarEstado({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const { estaActivo } = await request.validateUsing(cambiarEstadoActivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const usuario = await Usuario.query({ client: trx }).where('id', Number(params.id)).first()
      if (!usuario) {
        return response.status(404).json({
          codigo: 'USUARIO_NO_ENCONTRADO',
          mensaje: 'El usuario especificado no existe.',
        })
      }

      usuario.estaActivo = estaActivo
      usuario.useTransaction(trx)
      await usuario.save()

      return response.status(200).json({
        mensaje: `Usuario ${estaActivo ? 'activado' : 'desactivado'} exitosamente`,
        data: usuario,
      })
    })
  }
}
