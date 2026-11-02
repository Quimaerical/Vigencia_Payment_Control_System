import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'personas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // Datos personales básicos
      table.string('identificacion', 50).unique().notNullable()
      table.string('nombres', 100).notNullable()
      table.string('apellidos', 100).notNullable()
      table.string('correo', 255).unique().nullable()
      
      // Control de estado
      table.boolean('esta_activo').defaultTo(true)
      
      // Auditoría básica exigida
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
