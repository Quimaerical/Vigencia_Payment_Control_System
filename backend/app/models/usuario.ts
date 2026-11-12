import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { RolUsuario } from '@app/shared'
import Pago from './pago.js'
import AuditLog from './audit_log.js'

/**
 * Configuración del mixin de autenticación oficial de AdonisJS (AuthFinder):
 * - uids: ['username'] define el identificador único para el inicio de sesión.
 * - passwordColumnName: 'passwordHash' mapea la columna de almacenamiento seguro con hash Argon2/Bcrypt.
 *
 * NOTA DE NEGOCIO FUNDAMENTAL:
 * Los beneficiarios / personas que reciben asignaciones NO poseen usuarios en el sistema.
 * La entidad 'Usuario' está restringida exclusivamente a operadores autorizados del sistema
 * bajo segregación de funciones en tres roles canónicos:
 * 1. Administrador (gestión de parámetros y catálogos, sin operaciones monetarias).
 * 2. Generador de Nómina (administración de beneficiarios, causaciones y solicitudes).
 * 3. Receptor de Nómina (aprobación, desembolso físico/electrónico e imputación FIFO).
 */
const AuthFinder = withAuthFinder(hash, {
  uids: ['username'],
  passwordColumnName: 'passwordHash',
})

export default class Usuario extends compose(BaseModel, AuthFinder) {
  public static table = 'usuarios'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column({ serializeAs: null })
  declare passwordHash: string

  @column()
  declare rol: RolUsuario

  @column()
  declare estaActivo: boolean

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(Usuario)
  declare currentAccessToken?: AccessToken

  @hasMany(() => Pago)
  declare pagos: HasMany<typeof Pago>

  @hasMany(() => AuditLog)
  declare auditLogs: HasMany<typeof AuditLog>
}
