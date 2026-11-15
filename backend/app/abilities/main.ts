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

export const esAdministrador = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.ADMINISTRADOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol administrador pueden gestionar usuarios, parámetros y catálogos administrativos',
      403
    )
  }
  return true
})

export const esGenerador = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.GENERADOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol generador pueden gestionar proyectos, personas, asignaciones, causaciones y crear solicitudes',
      403
    )
  }
  return true
})

export const esReceptor = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.RECEPTOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol receptor pueden aprobar o rechazar solicitudes/vales y registrar entregas de fondos',
      403
    )
  }
  return true
})

export const registrarPago = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.RECEPTOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol receptor pueden procesar pagos',
      403
    )
  }
  return true
})

export const operarFinanzasNoAdmin = Bouncer.ability((user: Usuario) => {
  if (user.rol === RolUsuario.ADMINISTRADOR) {
    return AuthorizationResponse.deny(
      'Violación de Segregación de Funciones: El rol Administrador no participa en operaciones de dinero',
      403
    )
  }
  return true
})

/**
 * Lectura del detalle financiero (causaciones/deudas, asignaciones, solicitudes, pagos,
 * cajas chicas, vales y sus PDF). Lista blanca: solo Generador y Receptor, que lo necesitan
 * para operar; el Administrador solo lee el resumen agregado (ADR 0002).
 */
export const leerDetalleFinanciero = Bouncer.ability((user: Usuario) => {
  if (user.rol !== RolUsuario.GENERADOR && user.rol !== RolUsuario.RECEPTOR) {
    return AuthorizationResponse.deny(
      'Solo los usuarios con rol generador o receptor pueden consultar el detalle financiero; el administrador consulta el resumen agregado de reportes',
      403
    )
  }
  return true
})
