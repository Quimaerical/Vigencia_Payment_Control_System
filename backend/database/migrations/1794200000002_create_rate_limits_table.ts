import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Tabla de contadores del límite de intentos de login (@adonisjs/limiter, ADR 0004).
 * No guarda datos personales más allá de la clave login:<usuario>:<ip>, que caduca.
 */
export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  /**
   * Crea la tabla con el esquema que espera el store database del limiter.
   */
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 255).notNullable().primary()
      table.integer('points', 9).notNullable().defaultTo(0)
      table.bigint('expire').unsigned()
    })
  }

  /**
   * Elimina la tabla de contadores.
   */
  async down() {
    this.schema.dropTable(this.tableName)
  }
}
