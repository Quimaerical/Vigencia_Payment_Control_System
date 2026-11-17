import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Persona from '#models/persona'

const ROL_APP = 'vigencia_app'

/**
 * Matriz esperada de privilegios del rol de la aplicación (ADR 0017). Duplica a propósito la
 * de la migración 1794200000004: si alguien cambia una sin la otra, la prueba falla.
 */
const PRIVILEGIOS_ESPERADOS: Record<string, string[]> = {
  usuarios: ['SELECT', 'INSERT', 'UPDATE'],
  personas: ['SELECT', 'INSERT', 'UPDATE'],
  proyectos: ['SELECT', 'INSERT', 'UPDATE'],
  grupos_pagos: ['SELECT', 'INSERT', 'UPDATE'],
  asignaciones: ['SELECT', 'INSERT', 'UPDATE'],
  solicitudes_pago: ['SELECT', 'INSERT', 'UPDATE'],
  deudas: ['SELECT', 'INSERT', 'UPDATE'],
  pagos: ['SELECT', 'INSERT', 'UPDATE'],
  prorrateos: ['SELECT', 'INSERT', 'UPDATE'],
  cajas_chicas: ['SELECT', 'INSERT', 'UPDATE'],
  vales_caja: ['SELECT', 'INSERT', 'UPDATE'],
  audit_logs: ['SELECT', 'INSERT'],
  auth_access_tokens: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  rate_limits: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  adonis_schema: [],
  adonis_schema_versions: [],
  users: [],
}

const TODOS_LOS_PRIVILEGIOS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
]

const SIN_PERMISO = /permission denied/
const NO_ES_DUENO = /must be owner of/

/**
 * Ejecuta la acción como el rol de la aplicación dentro de un punto de guardado de la
 * transacción global. Si la acción falla, el ROLLBACK del punto de guardado deshace también
 * el SET LOCAL ROLE; si termina bien, se restaura el rol antes de liberar el punto.
 */
async function comoRolApp<T>(accion: (trx: TransactionClientContract) => Promise<T>): Promise<T> {
  return db.transaction(async (trx) => {
    await trx.rawQuery(`SET LOCAL ROLE ${ROL_APP}`)
    const resultado = await accion(trx)
    await trx.rawQuery('RESET ROLE')
    return resultado
  })
}

test.group('Rol de BD de la aplicación sin DDL (ADR 0017)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el rol existe sin atributos privilegiados ni pertenencia al dueño', async ({ assert }) => {
    const atributos = await db.rawQuery(
      `SELECT rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls, rolinherit
       FROM pg_roles WHERE rolname = ?`,
      [ROL_APP]
    )
    assert.lengthOf(atributos.rows, 1)
    const fila = atributos.rows[0]
    for (const atributo of [
      'rolsuper',
      'rolcreaterole',
      'rolcreatedb',
      'rolreplication',
      'rolbypassrls',
      'rolinherit',
    ]) {
      assert.isFalse(fila[atributo], atributo)
    }

    const membresia = await db.rawQuery(
      `SELECT pg_has_role(?, tableowner, 'MEMBER') AS es_miembro FROM pg_tables
       WHERE schemaname = 'public' AND tablename = 'audit_logs'`,
      [ROL_APP]
    )
    assert.isFalse(membresia.rows[0].es_miembro)

    const propios = await db.rawQuery(
      `SELECT count(*)::int AS total FROM pg_class c
       JOIN pg_roles r ON r.oid = c.relowner WHERE r.rolname = ?`,
      [ROL_APP]
    )
    assert.equal(propios.rows[0].total, 0)
  })

  test('la matriz de privilegios es exacta y cubre todas las tablas', async ({ assert }) => {
    const resultado = await db.rawQuery(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    const tablas: string[] = resultado.rows.map((f: { tablename: string }) => f.tablename)
    assert.sameMembers(
      tablas,
      Object.keys(PRIVILEGIOS_ESPERADOS),
      'toda tabla nueva necesita su fila en PRIVILEGIOS_APP (ADR 0017)'
    )

    for (const tabla of tablas) {
      const esperados = PRIVILEGIOS_ESPERADOS[tabla] ?? []
      for (const privilegio of TODOS_LOS_PRIVILEGIOS) {
        const r = await db.rawQuery('SELECT has_table_privilege(?, ?, ?) AS tiene', [
          ROL_APP,
          `public.${tabla}`,
          privilegio,
        ])
        assert.equal(r.rows[0].tiene, esperados.includes(privilegio), `${tabla}.${privilegio}`)
      }
    }

    for (const [tabla, esperados] of Object.entries(PRIVILEGIOS_ESPERADOS)) {
      if (!esperados.includes('INSERT') || tabla === 'rate_limits') continue
      const r = await db.rawQuery('SELECT has_sequence_privilege(?, ?, ?) AS tiene', [
        ROL_APP,
        `public.${tabla}_id_seq`,
        'USAGE',
      ])
      assert.isTrue(r.rows[0].tiene, `${tabla}_id_seq`)
    }

    const sinAcceso = await db.rawQuery('SELECT has_sequence_privilege(?, ?, ?) AS tiene', [
      ROL_APP,
      'public.adonis_schema_id_seq',
      'USAGE',
    ])
    assert.isFalse(sinAcceso.rows[0].tiene)

    const esquema = await db.rawQuery(
      `SELECT has_schema_privilege(?, 'public', 'CREATE') AS tiene`,
      [ROL_APP]
    )
    assert.isFalse(esquema.rows[0].tiene)
  })

  test('como vigencia_app no se pueden desactivar ni borrar los triggers de audit_logs', async ({
    assert,
  }) => {
    await assert.rejects(
      () => comoRolApp((trx) => trx.rawQuery('ALTER TABLE audit_logs DISABLE TRIGGER ALL')),
      NO_ES_DUENO
    )
    await assert.rejects(
      () =>
        comoRolApp((trx) => trx.rawQuery('DROP TRIGGER trg_no_truncate_audit_logs ON audit_logs')),
      NO_ES_DUENO
    )
  })

  test('como vigencia_app no se puede reemplazar la función de auditoría ni crear tablas', async ({
    assert,
  }) => {
    await assert.rejects(
      () =>
        comoRolApp((trx) =>
          trx.rawQuery(
            'CREATE OR REPLACE FUNCTION fn_auditar_cambios() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql'
          )
        ),
      SIN_PERMISO
    )
    await assert.rejects(
      () => comoRolApp((trx) => trx.rawQuery('CREATE TABLE tabla_intrusa (id int)')),
      SIN_PERMISO
    )
  })

  test('como vigencia_app DELETE, UPDATE y TRUNCATE se rechazan por permiso antes que por trigger', async ({
    assert,
  }) => {
    for (const sentencia of [
      'DELETE FROM audit_logs',
      "UPDATE audit_logs SET accion = 'X'",
      'TRUNCATE audit_logs',
      'TRUNCATE pagos',
    ]) {
      await assert.rejects(() => comoRolApp((trx) => trx.rawQuery(sentencia)), SIN_PERMISO)
    }
  })

  test('como vigencia_app la auditoría automática sigue funcionando', async ({ assert }) => {
    const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    const filas = await comoRolApp(async (trx) => {
      const persona = await Persona.create(
        {
          identificacion: `V-ROL-${sufijo}`,
          nombres: 'Rol',
          apellidos: 'Aplicacion',
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
    assert.lengthOf(filas, 1)
  })

  test('como vigencia_app no puede leer ni alterar el registro de migraciones', async ({
    assert,
  }) => {
    await assert.rejects(
      () => comoRolApp((trx) => trx.rawQuery('SELECT * FROM adonis_schema')),
      SIN_PERMISO
    )
    await assert.rejects(
      () => comoRolApp((trx) => trx.rawQuery('DELETE FROM adonis_schema')),
      SIN_PERMISO
    )
  })
})
