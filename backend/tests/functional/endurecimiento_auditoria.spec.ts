import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { ApiResponse } from '@japa/api-client'
import Persona from '#models/persona'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

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

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Crea un usuario con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `s04_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Deja sin administradores activos la base antes de crear los de la prueba: otras pruebas
 * (incluidas las de concurrencia, ya confirmadas) dejan administradores activos.
 */
async function desactivarAdministradores() {
  await db
    .from('usuarios')
    .where('rol', RolUsuario.ADMINISTRADOR)
    .where('esta_activo', true)
    .update({ esta_activo: false })
}

/**
 * Comprueba un 422 de VineJS sobre el campo `password` con la regla indicada.
 */
function assertErrorContrasena(
  assert: { equal: Function; isTrue: Function },
  resp: ApiResponse,
  regla: string
) {
  assert.equal(resp.status(), 422)
  const errores = (resp.body() as { errors?: { field: string; rule: string }[] }).errors ?? []
  assert.isTrue(
    errores.some((e) => e.field === 'password' && e.rule === regla),
    `se esperaba la regla ${regla} en password: ${resp.text()}`
  )
}

test.group('Política de contraseñas al crear usuarios (ADR 0006)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rechaza contraseñas cortas, largas, iguales al username o comunes', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'pol')
    const username = `pol_usuario_${Date.now()}`
    const crear = (password: string) =>
      client
        .post('/api/v1/usuarios')
        .loginAs(admin)
        .json({ username, password, rol: RolUsuario.GENERADOR })

    assertErrorContrasena(assert, await crear('a'.repeat(11)), 'minLength')
    assertErrorContrasena(assert, await crear('a'.repeat(129)), 'maxLength')
    assertErrorContrasena(assert, await crear(username.toUpperCase()), 'contrasenaIgualUsuario')
    assertErrorContrasena(assert, await crear('Password1234'), 'contrasenaComun')

    const total = await db.from('usuarios').where('username', username).count('* as total')
    assert.equal(Number(total[0].total), 0)
  })

  test('acepta una frase de paso de 12 caracteres sin reglas de composición', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'pol')
    const resp = await client
      .post('/api/v1/usuarios')
      .loginAs(admin)
      .json({
        username: `pol_frase_${Date.now()}`,
        password: 'caballo azul',
        rol: RolUsuario.GENERADOR,
      })

    assert.equal(resp.status(), 201, resp.text())
  })
})

test.group('Último Administrador activo (ADR 0009)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('desactivar al único Administrador activo responde 422 ULTIMO_ADMINISTRADOR', async ({
    client,
    assert,
  }) => {
    await desactivarAdministradores()
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'unico')

    const resp = await client
      .patch(`/api/v1/usuarios/${admin.id}/estado`)
      .loginAs(admin)
      .json({ estaActivo: false })

    assert.equal(resp.status(), 422, resp.text())
    assert.equal((resp.body() as { codigo: string }).codigo, 'ULTIMO_ADMINISTRADOR')
    await admin.refresh()
    assert.isTrue(admin.estaActivo)
  })

  test('con dos Administradores activos, uno puede desactivarse a sí mismo', async ({
    client,
    assert,
  }) => {
    await desactivarAdministradores()
    const adminA = await crearUsuario(RolUsuario.ADMINISTRADOR, 'a')
    await crearUsuario(RolUsuario.ADMINISTRADOR, 'b')

    const resp = await client
      .patch(`/api/v1/usuarios/${adminA.id}/estado`)
      .loginAs(adminA)
      .json({ estaActivo: false })

    assert.equal(resp.status(), 200, resp.text())
    await adminA.refresh()
    assert.isFalse(adminA.estaActivo)
  })
})

/**
 * [concurrencia] Sin transacción global (ADR 0010 §4): cada petición necesita su propia
 * conexión para que el FOR UPDATE se bloquee de verdad. La prueba retiene un FOR NO KEY UPDATE
 * sobre los dos administradores mientras lanza las peticiones, para que ambas pasen la
 * autenticación y lleguen a la vez a la transacción; luego lo suelta. Los usuarios quedan
 * en `vigencia_test` y los borra el `migration:fresh` de la siguiente ejecución.
 */
test.group('[concurrencia] Último Administrador con desactivaciones simultáneas', () => {
  test('dos Administradores que se desactivan entre sí: uno 200 y otro 422', async ({
    client,
    assert,
  }) => {
    await desactivarAdministradores()
    const adminA = await crearUsuario(RolUsuario.ADMINISTRADOR, 'conc_a')
    const adminB = await crearUsuario(RolUsuario.ADMINISTRADOR, 'conc_b')

    // FOR NO KEY UPDATE (no FOR UPDATE): choca con el FOR UPDATE del controlador, pero no con
    // el FOR KEY SHARE que toma la FK al insertar el token de loginAs ni la fila de audit_logs
    const bloqueo = await db.transaction()
    await bloqueo.rawQuery('SELECT id FROM usuarios WHERE id IN (?, ?) FOR NO KEY UPDATE', [
      adminA.id,
      adminB.id,
    ])

    const peticiones = Promise.all([
      client
        .patch(`/api/v1/usuarios/${adminB.id}/estado`)
        .loginAs(adminA)
        .json({ estaActivo: false }),
      client
        .patch(`/api/v1/usuarios/${adminA.id}/estado`)
        .loginAs(adminB)
        .json({ estaActivo: false }),
    ])

    // Margen para que ambas peticiones se autentiquen y esperen en el FOR UPDATE
    await new Promise((resolver) => setTimeout(resolver, 500))
    await bloqueo.commit()

    const respuestas = await peticiones
    const estados = respuestas.map((r) => r.status()).sort()
    assert.deepEqual(estados, [200, 422], respuestas.map((r) => r.text()).join(' | '))

    const rechazada = respuestas.find((r) => r.status() === 422)!
    assert.equal((rechazada.body() as { codigo: string }).codigo, 'ULTIMO_ADMINISTRADOR')

    const activos = await db
      .from('usuarios')
      .where('rol', RolUsuario.ADMINISTRADOR)
      .where('esta_activo', true)
      .count('* as total')
    assert.equal(Number(activos[0].total), 1)
  })
})
