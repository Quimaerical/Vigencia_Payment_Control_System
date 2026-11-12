import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'deudas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relaciones (Foreign Keys)
      table
        .integer('persona_id')
        .unsigned()
        .references('id')
        .inTable('personas')
        .onDelete('RESTRICT')
      table
        .integer('proyecto_id')
        .unsigned()
        .references('id')
        .inTable('proyectos')
        .onDelete('RESTRICT')
      table
        .integer('grupo_pago_id')
        .unsigned()
        .references('id')
        .inTable('grupos_pagos')
        .onDelete('RESTRICT')

      // Datos financieros
      table.decimal('monto_original', 12, 2).notNullable()
      table.decimal('saldo_pendiente', 12, 2).notNullable()
      table.date('fecha_vencimiento').notNullable() // Clave para ordenar en el algoritmo FIFO

      // Estados: 'pendiente', 'pagada', 'anulada'
      table.string('estado', 20).defaultTo('pendiente')

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
