import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { EstadoSolicitud } from '@app/shared'
import Proyecto from './proyecto.js'
import GrupoPago from './grupo_pago.js'
import Usuario from './usuario.js'
import Deuda from './deuda.js'
import Pago from './pago.js'

export default class SolicitudPago extends BaseModel {
  public static table = 'solicitudes_pago'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare proyectoId: number

  @column()
  declare grupoPagoId: number | null

  @column.date()
  declare periodoInicio: DateTime

  @column.date()
  declare periodoFin: DateTime

  @column()
  declare montoTotal: number

  @column()
  declare estado: EstadoSolicitud | string

  @column()
  declare creadoPorId: number

  @column()
  declare revisadoPorId: number | null

  @column.dateTime()
  declare fechaEnvio: DateTime | null

  @column.dateTime()
  declare fechaRevision: DateTime | null

  @column()
  declare motivoRechazo: string | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Proyecto)
  declare proyecto: BelongsTo<typeof Proyecto>

  @belongsTo(() => GrupoPago)
  declare grupoPago: BelongsTo<typeof GrupoPago>

  @belongsTo(() => Usuario, { foreignKey: 'creadoPorId' })
  declare creadoPor: BelongsTo<typeof Usuario>

  @belongsTo(() => Usuario, { foreignKey: 'revisadoPorId' })
  declare revisadoPor: BelongsTo<typeof Usuario>

  @hasMany(() => Deuda, { foreignKey: 'solicitudId' })
  declare deudas: HasMany<typeof Deuda>

  @hasMany(() => Pago, { foreignKey: 'solicitudId' })
  declare pagos: HasMany<typeof Pago>
}
