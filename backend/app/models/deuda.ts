import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Persona from './persona.js'
import Proyecto from './proyecto.js'
import GrupoPago from './grupo_pago.js'
import Prorrateo from './prorrateo.js'
import Asignacion from './asignacion.js'
import SolicitudPago from './solicitud_pago.js'
import Usuario from './usuario.js'

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
  declare asignacionId: number | null

  @column()
  declare solicitudId: number | null

  @column()
  declare creadoPorId: number | null

  @column()
  declare montoOriginal: number

  @column()
  declare saldoPendiente: number

  @column.date()
  declare fechaVencimiento: DateTime

  @column.date()
  declare periodoInicio: DateTime | null

  @column.date()
  declare periodoFin: DateTime | null

  @column()
  declare diasActivos: number | null

  @column()
  declare diasPeriodo: number | null

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

  @belongsTo(() => Proyecto)
  declare proyecto: BelongsTo<typeof Proyecto>

  @belongsTo(() => GrupoPago)
  declare grupoPago: BelongsTo<typeof GrupoPago>

  @belongsTo(() => Asignacion)
  declare asignacion: BelongsTo<typeof Asignacion>

  @belongsTo(() => SolicitudPago, { foreignKey: 'solicitudId' })
  declare solicitudPago: BelongsTo<typeof SolicitudPago>

  @belongsTo(() => Usuario, { foreignKey: 'creadoPorId' })
  declare creadoPor: BelongsTo<typeof Usuario>

  @belongsTo(() => Usuario, { foreignKey: 'anuladoPorId' })
  declare anuladoPor: BelongsTo<typeof Usuario>

  @hasMany(() => Prorrateo)
  declare prorrateos: HasMany<typeof Prorrateo>
}
