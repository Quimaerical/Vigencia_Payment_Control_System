import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { AreaProyecto, AmbitoProyecto } from '@app/shared'
import Deuda from './deuda.js'
import Asignacion from './asignacion.js'
import SolicitudPago from './solicitud_pago.js'
import CajaChica from './caja_chica.js'

export default class Proyecto extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare area: AreaProyecto | string

  @column()
  declare ambito: AmbitoProyecto | string

  @column.date()
  declare fechaInicio: DateTime | null

  @column.date()
  declare fechaFin: DateTime | null

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

  @hasMany(() => CajaChica)
  declare cajasChicas: HasMany<typeof CajaChica>
}
