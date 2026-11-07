/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'
import type Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

export const registrarPago = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.RECEPTOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol receptor pueden procesar pagos',
      403
    )
  }
  return true
})
