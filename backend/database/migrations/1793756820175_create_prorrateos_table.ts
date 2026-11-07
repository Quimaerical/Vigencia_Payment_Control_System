import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'prorrateos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relaciones restringidas por inmutabilidad
      table.integer('pago_id').unsigned().references('id').inTable('pagos').onDelete('RESTRICT')
      table.integer('deuda_id').unsigned().references('id').inTable('deudas').onDelete('RESTRICT')

      // Monto exacto que se descontó de esa deuda con este pago
      table.decimal('monto_aplicado', 12, 2).notNullable()

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
