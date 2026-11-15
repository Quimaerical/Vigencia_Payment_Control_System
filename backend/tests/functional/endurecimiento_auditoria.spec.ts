import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Persona from '#models/persona'

/**
 * Tablas protegidas contra TRUNCATE (ADR 0008).
 */
const TABLAS_SIN_TRUNCATE = [
  'solicitudes_pago',
  'deudas',
  'pagos',
  'prorrateos',
  'cajas_chicas',
  'vales_caja',
  'audit_logs',
]

const ERROR_TRUNCATE = /Violación de Inmutabilidad Financiera: No está permitido truncar la tabla/

/**
 * Ejecuta sentencias dentro de un punto de guardado (SAVEPOINT) de la transacción global:
 * un error SQL revierte solo ese punto y la prueba puede seguir consultando.
 */
async function enPuntoDeGuardado<T>(
  accion: (trx: TransactionClientContract) => Promise<T>
): Promise<T> {
  return db.transaction(async (trx) => accion(trx))
}

test.group('Endurecimiento de audit_logs (ADR 0007, 0008)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('activar app.skip_auto_audit no evita la auditoría automática', async ({ assert }) => {
    const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

    const filas = await enPuntoDeGuardado(async (trx) => {
      await trx.rawQuery(`SELECT set_config('app.skip_auto_audit', 'true', true)`)
      const persona = await Persona.create(
        {
          identificacion: `V-AUD-${sufijo}`,
          nombres: 'Bypass',
          apellidos: 'Intentado',
          estaActivo: true,
        },
        { client: trx }
      )
      return trx
        .from('audit_logs')
        .where('tabla_afectada', 'personas')
        .where('registro_id', persona.id)
        .where('accion', 'INSERT_PERSONAS')
    })

    assert.lengthOf(filas, 1, 'el INSERT debía dejar exactamente una fila de auditoría')
  })

  test('fn_auditar_cambios ya no consulta app.skip_auto_audit', async ({ assert }) => {
    const resultado = await db.rawQuery(
      `SELECT prosrc FROM pg_proc WHERE proname = 'fn_auditar_cambios'`
    )
    assert.lengthOf(resultado.rows, 1)
    assert.notInclude(resultado.rows[0].prosrc, 'skip_auto_audit')
  })

  test('TRUNCATE ... CASCADE falla en audit_logs y en cada tabla financiera', async ({
    assert,
  }) => {
    for (const tabla of TABLAS_SIN_TRUNCATE) {
      await assert.rejects(
        () => enPuntoDeGuardado((trx) => trx.rawQuery(`TRUNCATE ${tabla} CASCADE`)),
        ERROR_TRUNCATE
      )
    }
  })

  test('cada tabla protegida tiene su trigger trg_no_truncate_<tabla>', async ({ assert }) => {
    const resultado = await db.rawQuery(
      `SELECT tgrelid::regclass::text AS tabla FROM pg_trigger WHERE tgname LIKE 'trg_no_truncate_%'`
    )
    const tablas = resultado.rows.map((fila: { tabla: string }) => fila.tabla).sort()
    assert.deepEqual(tablas, [...TABLAS_SIN_TRUNCATE].sort())
  })
})
