import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Persona from './persona.js'
import Prorrateo from './prorrateo.js'
import Usuario from './usuario.js'
import SolicitudPago from './solicitud_pago.js'

export default class Pago extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare personaId: number

  @column()
  declare usuarioId: number

  @column()
  declare solicitudId: number | null

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

  @column()
  declare motivoAnulacion: string | null

  @column()
  declare anuladoPorId: number | null

  @column.dateTime()
  declare fechaAnulacion: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Persona)
  declare persona: BelongsTo<typeof Persona>

  @belongsTo(() => Usuario)
  declare usuario: BelongsTo<typeof Usuario>

  @belongsTo(() => SolicitudPago, { foreignKey: 'solicitudId' })
  declare solicitudPago: BelongsTo<typeof SolicitudPago>

  @belongsTo(() => Usuario, { foreignKey: 'anuladoPorId' })
  declare anuladoPor: BelongsTo<typeof Usuario>

  @hasMany(() => Prorrateo)
  declare prorrateos: HasMany<typeof Prorrateo>
}
