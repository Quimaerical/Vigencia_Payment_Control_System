import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Solicitud de pago asociada al desembolso (nullable para pagos directos por proyecto/persona)
      table
        .integer('solicitud_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('solicitudes_pago')
        .onDelete('RESTRICT')

      // Trazabilidad de anulación justificada (inmutabilidad financiera)
      table.string('motivo_anulacion', 500).nullable()
      table
        .integer('anulado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')
      table.timestamp('fecha_anulacion', { useTz: true }).nullable()
    })

    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT chk_pagos_monto_positivo
        CHECK (monto_total > 0);
      `)
    }
  }

  async down() {
    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP CONSTRAINT IF EXISTS chk_pagos_monto_positivo;
      `)
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['solicitud_id'])
      table.dropForeign(['anulado_por_id'])
      table.dropColumns('solicitud_id', 'motivo_anulacion', 'anulado_por_id', 'fecha_anulacion')
    })
  }
}
