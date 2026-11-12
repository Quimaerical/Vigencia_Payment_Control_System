import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'grupos_pagos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Periodicidad de causación: 'semanal', 'quincenal', 'mensual'
      table.string('periodicidad', 20).notNullable().defaultTo('mensual')

      // Fechas/días de corte adaptables (ej. 15 y 30 en quincenal, 30 en mensual, 1-7 en semanal)
      table.integer('dia_corte_1').nullable()
      table.integer('dia_corte_2').nullable()
      table.jsonb('configuracion_corte').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('periodicidad', 'dia_corte_1', 'dia_corte_2', 'configuracion_corte')
    })
  }
}
