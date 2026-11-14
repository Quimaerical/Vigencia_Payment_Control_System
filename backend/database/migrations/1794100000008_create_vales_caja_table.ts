import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vales_caja'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('caja_chica_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('cajas_chicas')
        .onDelete('RESTRICT')

      table
        .integer('solicitante_persona_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('personas')
        .onDelete('RESTRICT')

      table
        .integer('tramitado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table
        .integer('aprobado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table.decimal('monto_solicitado', 12, 2).notNullable()
      table.decimal('monto_rendido', 12, 2).nullable()
      table.string('concepto', 300).notNullable()
      table.string('comprobante_referencia', 150).nullable()

      // Estados: 'solicitado', 'aprobado', 'rechazado', 'desembolsado', 'rendido', 'anulado'
      table.string('estado', 20).notNullable().defaultTo('solicitado')
      table.string('motivo_rechazo', 500).nullable()

      // Campos de anulación justificada
      table.string('motivo_anulacion', 500).nullable()
      table
        .integer('anulado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      table.timestamp('fecha_solicitud', { useTz: true }).defaultTo(this.now())
      table.timestamp('fecha_aprobacion', { useTz: true }).nullable()
      table.timestamp('fecha_desembolso', { useTz: true }).nullable()
      table.timestamp('fecha_rendicion', { useTz: true }).nullable()
      table.timestamp('fecha_anulacion', { useTz: true }).nullable()

      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })

    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT chk_vales_montos
        CHECK (monto_solicitado > 0 AND (monto_rendido IS NULL OR monto_rendido >= 0));
      `)
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
