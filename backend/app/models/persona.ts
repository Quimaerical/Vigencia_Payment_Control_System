import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Deuda from './deuda.js'
import Pago from './pago.js'

export default class Persona extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare identificacion: string

  @column()
  declare nombres: string

  @column()
  declare apellidos: string

  @column()
  declare correo: string | null

  @column()
  declare estaActivo: boolean

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @hasMany(() => Deuda)
  declare deudas: HasMany<typeof Deuda>

  @hasMany(() => Pago)
  declare pagos: HasMany<typeof Pago>
}
