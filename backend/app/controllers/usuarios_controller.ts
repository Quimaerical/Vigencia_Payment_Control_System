import Usuario from '#models/usuario'
import { crearUsuarioAdminValidator, cambiarEstadoActivoValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UsuarioTransformer from '#transformers/usuario_transformer'
import { esAdministrador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class UsuariosController {
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
   * Activa o desactiva lógicamente a un usuario y revoca sus tokens activos al desactivar
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

      if (!estaActivo) {
        await trx.from('auth_access_tokens').where('tokenable_id', usuario.id).delete()
      }

      return response.status(200).json({
        mensaje: `Usuario ${estaActivo ? 'activado' : 'desactivado'} exitosamente`,
        data: usuario,
      })
    })
  }
}
