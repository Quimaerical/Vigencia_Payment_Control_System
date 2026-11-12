import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('persona_id')
        .unsigned()
        .references('id')
        .inTable('personas')
        .onDelete('RESTRICT')
      table
        .integer('usuario_id')
        .unsigned()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT') // Quién registró el pago

      table.decimal('monto_total', 12, 2).notNullable()
      table.string('metodo_pago', 50).notNullable() // ej. Transferencia, Efectivo
      table.string('numero_referencia', 100).unique().nullable()
      table.date('fecha_pago').notNullable()

      // Estados: 'procesado', 'anulado'
      table.string('estado', 20).defaultTo('procesado')

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
