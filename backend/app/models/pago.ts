import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Persona from './persona.js'
import Prorrateo from './prorrateo.js'

export default class Pago extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare personaId: number

  @column()
  declare usuarioId: number

  @column()
  declare montoTotal: number

  @column()
  declare metodoPago: string

  @column()
  declare numeroReferencia: string | null

  @column.date()
  declare fechaPago: DateTime

  @column()
  declare estado: string

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Persona)
  declare persona: BelongsTo<typeof Persona>

  @hasMany(() => Prorrateo)
  declare prorrateos: HasMany<typeof Prorrateo>
}
