import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usuarios'

  async up() {
    // 1. Crear el tipo ENUM nativo en PostgreSQL de forma segura
    await this.schema.raw(`
      DO $$ BEGIN
        CREATE TYPE rol_usuario AS ENUM ('administrador', 'generador', 'receptor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // 2. Construir la tabla con las reglas del diccionario de datos
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('username', 50).unique().notNullable()
      table.string('password_hash', 255).notNullable()
      
      // Asignar el tipo ENUM creado previamente
      table.specificType('rol', 'rol_usuario').notNullable()
      
      table.boolean('esta_activo').defaultTo(true)
      
      // Manejo de fecha de creación exigido en el requerimiento
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    // Revertir los cambios si hacemos rollback de la base de datos
    this.schema.dropTable(this.tableName)
    await this.schema.raw('DROP TYPE IF EXISTS rol_usuario CASCADE;')
  }
}
