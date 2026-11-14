import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { EstadoValeCaja } from '@app/shared'
import CajaChica from './caja_chica.js'
import Persona from './persona.js'
import Usuario from './usuario.js'

export default class ValeCaja extends BaseModel {
  public static table = 'vales_caja'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cajaChicaId: number

  @column()
  declare solicitantePersonaId: number

  @column()
  declare tramitadoPorId: number

  @column()
  declare aprobadoPorId: number | null

  @column()
  declare montoSolicitado: number

  @column()
  declare montoRendido: number | null

  @column()
  declare concepto: string

  @column()
  declare comprobanteReferencia: string | null

  @column()
  declare estado: EstadoValeCaja | string

  @column()
  declare motivoRechazo: string | null

  @column()
  declare motivoAnulacion: string | null

  @column()
  declare anuladoPorId: number | null

  @column.dateTime()
  declare fechaSolicitud: DateTime

  @column.dateTime()
  declare fechaAprobacion: DateTime | null

  @column.dateTime()
  declare fechaDesembolso: DateTime | null

  @column.dateTime()
  declare fechaRendicion: DateTime | null

  @column.dateTime()
  declare fechaAnulacion: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => CajaChica)
  declare cajaChica: BelongsTo<typeof CajaChica>

  @belongsTo(() => Persona, { foreignKey: 'solicitantePersonaId' })
  declare solicitantePersona: BelongsTo<typeof Persona>

  @belongsTo(() => Usuario, { foreignKey: 'tramitadoPorId' })
  declare tramitadoPor: BelongsTo<typeof Usuario>

  @belongsTo(() => Usuario, { foreignKey: 'aprobadoPorId' })
  declare aprobadoPor: BelongsTo<typeof Usuario>

  @belongsTo(() => Usuario, { foreignKey: 'anuladoPorId' })
  declare anuladoPor: BelongsTo<typeof Usuario>
}
