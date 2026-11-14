import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'solicitudes_pago'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('codigo', 50).unique().notNullable()

      table
        .integer('proyecto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('proyectos')
        .onDelete('RESTRICT')

      table
        .integer('grupo_pago_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('grupos_pagos')
        .onDelete('RESTRICT')

      // Período consolidado en la solicitud
      table.date('periodo_inicio').notNullable()
      table.date('periodo_fin').notNullable()

      table.decimal('monto_total', 12, 2).notNullable().defaultTo(0)

      // Flujo de estados: 'creacion', 'envio', 'aprobacion', 'rechazada', 'entrega', 'cierre'
      table.string('estado', 20).notNullable().defaultTo('creacion')

      // Trazabilidad de segregación de funciones
      table
        .integer('creado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table
        .integer('revisado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table.timestamp('fecha_envio', { useTz: true }).nullable()
      table.timestamp('fecha_revision', { useTz: true }).nullable()
      table.string('motivo_rechazo', 500).nullable()

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
