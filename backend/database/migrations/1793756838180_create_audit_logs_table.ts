import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // Quién hizo el cambio (puede ser nulo si fue un proceso automático del sistema)
      table.integer('usuario_id').unsigned().references('id').inTable('usuarios').onDelete('SET NULL').nullable()
      
      // Metadatos de la acción
      table.string('accion', 50).notNullable() // Ej: 'CREAR_PAGO', 'ANULAR_DEUDA'
      table.string('tabla_afectada', 50).notNullable()
      table.integer('registro_id').unsigned().notNullable()
      
      // Snapshot forense (estado antes y después del cambio)
      table.json('datos_anteriores').nullable()
      table.json('datos_nuevos').nullable()
      
      table.string('direccion_ip', 45).nullable()
      
      // Solo tiene fecha de creación por su naturaleza inmutable
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
