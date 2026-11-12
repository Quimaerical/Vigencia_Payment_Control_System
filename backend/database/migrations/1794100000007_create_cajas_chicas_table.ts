import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cajas_chicas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('codigo', 50).unique().notNullable()
      table.string('nombre', 150).notNullable()

      table
        .integer('proyecto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('proyectos')
        .onDelete('RESTRICT')

      // Trazabilidad formal del arrastre de saldo del mes anterior
      table
        .integer('caja_origen_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('cajas_chicas')
        .onDelete('RESTRICT')

      table
        .integer('responsable_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table.integer('anio').notNullable()
      table.integer('mes').notNullable()

      table.decimal('saldo_inicial', 12, 2).notNullable().defaultTo(0)
      table.decimal('monto_asignado', 12, 2).notNullable().defaultTo(0)
      table.decimal('saldo_actual', 12, 2).notNullable().defaultTo(0)

      // Estados: 'abierta', 'cerrada'
      table.string('estado', 20).notNullable().defaultTo('abierta')

      table.timestamp('fecha_apertura', { useTz: true }).defaultTo(this.now())
      table.timestamp('fecha_cierre', { useTz: true }).nullable()

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
