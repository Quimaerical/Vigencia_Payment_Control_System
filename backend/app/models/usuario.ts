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
