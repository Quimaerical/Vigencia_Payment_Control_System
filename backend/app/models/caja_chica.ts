import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { EstadoCajaChica } from '@app/shared'
import Proyecto from './proyecto.js'
import Usuario from './usuario.js'
import ValeCaja from './vale_caja.js'

export default class CajaChica extends BaseModel {
  public static table = 'cajas_chicas'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare proyectoId: number

  @column()
  declare cajaOrigenId: number | null

  @column()
  declare responsableId: number

  @column()
  declare anio: number

  @column()
  declare mes: number

  @column()
  declare saldoInicial: number

  @column()
  declare montoAsignado: number

  @column()
  declare saldoActual: number

  @column()
  declare estado: EstadoCajaChica | string

  @column.dateTime()
  declare fechaApertura: DateTime

  @column.dateTime()
  declare fechaCierre: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Proyecto)
  declare proyecto: BelongsTo<typeof Proyecto>

  @belongsTo(() => CajaChica, { foreignKey: 'cajaOrigenId' })
  declare cajaOrigen: BelongsTo<typeof CajaChica>

  @hasMany(() => CajaChica, { foreignKey: 'cajaOrigenId' })
  declare cajasSucesoras: HasMany<typeof CajaChica>

  @belongsTo(() => Usuario, { foreignKey: 'responsableId' })
  declare responsable: BelongsTo<typeof Usuario>

  @hasMany(() => ValeCaja)
  declare vales: HasMany<typeof ValeCaja>
}
