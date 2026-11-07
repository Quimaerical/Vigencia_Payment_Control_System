import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'proyectos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('codigo', 50).unique().notNullable()
      table.string('nombre', 150).notNullable()
      table.text('descripcion').nullable()

      table.boolean('esta_activo').defaultTo(true)
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
