import vine from '@vinejs/vine'
import { RolUsuario } from '@app/shared'
import { CONTRASENAS_COMUNES } from '#validators/contrasenas_comunes'

/**
 * Shared rules for username and password.
 */
const username = () => vine.string().trim().minLength(3).maxLength(50)

/**
 * Rechaza la contraseña si coincide con el username del mismo payload o con una
 * contraseña común, sin distinguir mayúsculas (ADR 0006).
 */
const contrasenaNoPredecible = vine.createRule((value, _opciones, field) => {
  if (typeof value !== 'string') {
    return
  }

  const contrasena = value.toLowerCase()
  const usuario = String(field.parent?.username ?? '')
    .trim()
    .toLowerCase()

  if (usuario !== '' && contrasena === usuario) {
    field.report(
      'La contraseña no puede ser igual al nombre de usuario.',
      'contrasenaIgualUsuario',
      field
    )
    return
  }

  if (CONTRASENAS_COMUNES.has(contrasena)) {
    field.report(
      'La contraseña es demasiado común. Use una frase de paso más larga.',
      'contrasenaComun',
      field
    )
  }
})

/**
 * Política de contraseñas NIST 800-63B: 12–128 caracteres, sin reglas de composición;
 * se aceptan espacios y Unicode para permitir frases de paso (ADR 0006).
 */
const password = () => vine.string().minLength(12).maxLength(128).use(contrasenaNoPredecible())

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
