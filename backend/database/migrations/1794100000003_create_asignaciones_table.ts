import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'asignaciones'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Cruce entre Persona (beneficiario), Proyecto y Grupo de Pago
      table
        .integer('persona_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('personas')
        .onDelete('RESTRICT')

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
        .notNullable()
        .references('id')
        .inTable('grupos_pagos')
        .onDelete('RESTRICT')

      // Autoría de creación (rol 'generador')
      table
        .integer('creado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      // Monto específico asignado por período completo en USD
      table.decimal('monto_periodo', 12, 2).notNullable()

      // Vigencia de la asignación para el cálculo de días activos (prorrateo)
      table.date('fecha_inicio').notNullable()
      table.date('fecha_fin').nullable()

      table.boolean('esta_activo').defaultTo(true)

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())

      table.index(
        ['persona_id', 'proyecto_id', 'grupo_pago_id', 'esta_activo'],
        'idx_asignaciones_cruce_activo'
      )
    })

    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT chk_asignaciones_monto_positivo
        CHECK (monto_periodo > 0);
      `)
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT chk_asignaciones_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);
      `)
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
