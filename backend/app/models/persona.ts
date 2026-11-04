import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

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
}
