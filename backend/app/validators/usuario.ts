import vine from '@vinejs/vine'
import { RolUsuario } from '@app/shared'

/**
 * Shared rules for username and password.
 */
const username = () => vine.string().trim().minLength(3).maxLength(50)
const password = () => vine.string().minLength(6).maxLength(100)

/**
 * Validator for Administrator creating system users with explicit role
 */
export const crearUsuarioAdminValidator = vine.create({
  username: username().unique({ table: 'usuarios', column: 'username' }),
  password: password(),
  rol: vine.enum(Object.values(RolUsuario)),
  estaActivo: vine.boolean().optional(),
})

/**
 * Validator for toggling active status on catalog/user records
 */
export const cambiarEstadoActivoValidator = vine.create({
  estaActivo: vine.boolean(),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  username: username(),
  password: vine.string(),
})
