import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'proyectos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Área científica del proyecto: 'fisica', 'quimica', 'biologia'
      table.string('area', 30).notNullable().defaultTo('fisica')

      // Ámbito operativo: 'interno', 'externo'
      table.string('ambito', 20).notNullable().defaultTo('interno')

      // Rango de vigencia del proyecto
      table.date('fecha_inicio').nullable()
      table.date('fecha_fin').nullable()
    })

    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT chk_proyectos_vigencia
        CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio);
      `)
    }
  }

  async down() {
    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP CONSTRAINT IF EXISTS chk_proyectos_vigencia;
      `)
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('area', 'ambito', 'fecha_inicio', 'fecha_fin')
    })
  }
}
