import vine from '@vinejs/vine'

/**
 * Shared rules for username and password.
 */
const username = () => vine.string().trim().minLength(3).maxLength(50)
const password = () => vine.string().minLength(6).maxLength(100)

/**
 * Validator to use when performing self-signup / registering a user
 */
export const signupValidator = vine.create({
  username: username().unique({ table: 'usuarios', column: 'username' }),
  password: password(),
  passwordConfirmation: password().sameAs('password').optional(),
  rol: vine.enum(['administrador', 'generador', 'receptor'] as const).optional(),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  username: username(),
  password: vine.string(),
})
