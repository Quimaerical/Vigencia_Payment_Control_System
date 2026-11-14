import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Persona from './persona.js'
import Proyecto from './proyecto.js'
import GrupoPago from './grupo_pago.js'
import Usuario from './usuario.js'
import Deuda from './deuda.js'

export default class Asignacion extends BaseModel {
  public static table = 'asignaciones'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare personaId: number

  @column()
  declare proyectoId: number

  @column()
  declare grupoPagoId: number

  @column()
  declare creadoPorId: number | null

  @column()
  declare montoPeriodo: number

  @column.date()
  declare fechaInicio: DateTime

  @column.date()
  declare fechaFin: DateTime | null

  @column()
  declare estaActivo: boolean

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

  @belongsTo(() => Usuario, { foreignKey: 'creadoPorId' })
  declare creadoPor: BelongsTo<typeof Usuario>

  @hasMany(() => Deuda)
  declare deudas: HasMany<typeof Deuda>
}
