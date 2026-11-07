import type Usuario from '#models/usuario'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UsuarioTransformer extends BaseTransformer<Usuario> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'username',
      'rol',
      'estaActivo',
      'creadoEn',
    ])
  }
}
