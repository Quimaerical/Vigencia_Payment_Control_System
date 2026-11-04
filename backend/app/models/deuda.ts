import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Persona from './persona.js'
import Proyecto from './proyecto.js'
import GrupoPago from './grupo_pago.js'
import Prorrateo from './prorrateo.js'

export default class Deuda extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare personaId: number

  @column()
  declare proyectoId: number

  @column()
  declare grupoPagoId: number

  @column()
  declare montoOriginal: number

  @column()
  declare saldoPendiente: number

  @column.date()
  declare fechaVencimiento: DateTime

  @column()
  declare estado: string

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Persona)
  declare persona: BelongsTo<typeof Persona>

  @belongsTo(() => Proyecto)
  declare proyecto: BelongsTo<typeof Proyecto>

  @belongsTo(() => GrupoPago)
  declare grupoPago: BelongsTo<typeof GrupoPago>

  @hasMany(() => Prorrateo)
  declare prorrateos: HasMany<typeof Prorrateo>
}
