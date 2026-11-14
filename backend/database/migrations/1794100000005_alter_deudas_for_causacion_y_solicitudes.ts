import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'deudas'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Vínculo opcional con la asignación que originó la causación/deuda
      table
        .integer('asignacion_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('asignaciones')
        .onDelete('RESTRICT')

      // Vínculo con la solicitud de pago que consolida esta causación
      table
        .integer('solicitud_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('solicitudes_pago')
        .onDelete('SET NULL')

      // Usuario generador que ejecutó la causación
      table
        .integer('creado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('RESTRICT')

      // Datos del período y prorrateo de días activos vs días totales del período
      table.date('periodo_inicio').nullable()
      table.date('periodo_fin').nullable()
      table.integer('dias_activos').nullable()
      table.integer('dias_periodo').nullable()

      // Campos de anulación justificada (inmutabilidad financiera)
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
        ADD CONSTRAINT chk_deudas_saldo
        CHECK (monto_original > 0 AND saldo_pendiente >= 0 AND saldo_pendiente <= monto_original);
      `)
    }
  }

  async down() {
    if (this.db.dialect.name === 'postgres') {
      this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP CONSTRAINT IF EXISTS chk_deudas_saldo;
      `)
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['asignacion_id'])
      table.dropForeign(['solicitud_id'])
      table.dropForeign(['creado_por_id'])
      table.dropForeign(['anulado_por_id'])
      table.dropColumns(
        'asignacion_id',
        'solicitud_id',
        'creado_por_id',
        'periodo_inicio',
        'periodo_fin',
        'dias_activos',
        'dias_periodo',
        'motivo_anulacion',
        'anulado_por_id',
        'fecha_anulacion'
      )
    })
  }
}
