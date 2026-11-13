import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { PeriodicidadGrupoPago } from '@app/shared'
import Deuda from './deuda.js'
import Asignacion from './asignacion.js'
import SolicitudPago from './solicitud_pago.js'

export default class GrupoPago extends BaseModel {
  public static table = 'grupos_pagos' // Forzamos el nombre exacto de la tabla

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare periodicidad: PeriodicidadGrupoPago | string

  @column()
  declare diaCorte1: number | null

  @column()
  declare diaCorte2: number | null

  @column()
  declare configuracionCorte: Record<string, unknown> | null

  @column()
  declare estaActivo: boolean

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  // Relaciones
  @hasMany(() => Deuda)
  declare deudas: HasMany<typeof Deuda>

  @hasMany(() => Asignacion)
  declare asignaciones: HasMany<typeof Asignacion>

  @hasMany(() => SolicitudPago)
  declare solicitudesPago: HasMany<typeof SolicitudPago>
}
