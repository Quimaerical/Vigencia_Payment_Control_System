import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    this.schema.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_deuda_causacion_periodo
      ON deudas (asignacion_id, periodo_inicio, periodo_fin)
      WHERE estado <> 'anulada'
        AND asignacion_id IS NOT NULL
        AND periodo_inicio IS NOT NULL
        AND periodo_fin IS NOT NULL;
    `)
  }

  async down() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    this.schema.raw(`DROP INDEX IF EXISTS uq_deuda_causacion_periodo;`)
  }
}
