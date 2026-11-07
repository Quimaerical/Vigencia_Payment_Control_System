import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Deuda from './deuda.js'

export default class GrupoPago extends BaseModel {
  public static table = 'grupos_pagos' // Forzamos el nombre exacto de la tabla

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estaActivo: boolean

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @hasMany(() => Deuda)
  declare deudas: HasMany<typeof Deuda>
}
