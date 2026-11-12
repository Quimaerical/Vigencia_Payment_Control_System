import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Usuario from './usuario.js'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare usuarioId: number | null

  @column()
  declare accion: string

  @column()
  declare tablaAfectada: string

  @column()
  declare registroId: number

  @column()
  declare datosAnteriores: any | null

  @column()
  declare datosNuevos: any | null

  @column()
  declare direccionIp: string | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @belongsTo(() => Usuario)
  declare usuario: BelongsTo<typeof Usuario>
}
