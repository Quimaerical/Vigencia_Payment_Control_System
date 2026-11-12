import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Pago from './pago.js'
import Deuda from './deuda.js'

export default class Prorrateo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare pagoId: number

  @column()
  declare deudaId: number

  @column()
  declare montoAplicado: number

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @belongsTo(() => Pago)
  declare pago: BelongsTo<typeof Pago>

  @belongsTo(() => Deuda)
  declare deuda: BelongsTo<typeof Deuda>
}
