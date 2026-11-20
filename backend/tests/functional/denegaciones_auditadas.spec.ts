import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Crea un usuario operador con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `den_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Devuelve las filas ACCESO_DENEGADO de un usuario, de la más nueva a la más vieja.
 */
async function denegacionesDe(usuarioId: number) {
  return db
    .from('audit_logs')
    .where('accion', 'ACCESO_DENEGADO')
    .where('usuario_id', usuarioId)
    .orderBy('id', 'desc')
}

/**
 * Cuenta todas las filas ACCESO_DENEGADO de la tabla.
 */
async function contarDenegaciones() {
  const fila = (await db
    .from('audit_logs')
    .where('accion', 'ACCESO_DENEGADO')
    .count('* as total')
    .first()) as { total: string | number }
  return Number(fila.total)
}

/**
 * Devuelve `datos_nuevos` como objeto aunque el driver lo entregue como texto.
 */
function datosNuevosDe(fila: { datos_nuevos: unknown }) {
  return (
    typeof fila.datos_nuevos === 'string' ? JSON.parse(fila.datos_nuevos) : fila.datos_nuevos
  ) as Record<string, unknown>
}

test.group('Denegaciones 403 auditadas (M2)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el Administrador que intenta pagar deja una fila ACCESO_DENEGADO sin el cuerpo', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')

    const resp = await client
      .post('/api/v1/pagos')
      .loginAs(admin)
      .json({ notas: 'CENTINELA_CUERPO_S07', montoTotal: 123456 } as never)
    resp.assertStatus(403)

    const filas = await denegacionesDe(admin.id)
    assert.lengthOf(filas, 1)
    const fila = filas[0]
    assert.equal(fila.tabla_afectada, 'autorizacion')
    assert.equal(Number(fila.registro_id), 0)
    assert.isNull(fila.datos_anteriores)
    assert.isNotNull(fila.direccion_ip)
    assert.deepEqual(datosNuevosDe(fila), {
      metodo: 'POST',
      ruta: '/api/v1/pagos',
      rol: 'administrador',
      motivo: 'Solo los usuarios con rol receptor pueden procesar pagos',
    })
    const texto = JSON.stringify(datosNuevosDe(fila))
    assert.notInclude(texto, 'CENTINELA_CUERPO_S07')
    assert.notInclude(texto, '123456')
  })

  test('la denegación sobre un recurso guarda su id de ruta', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')

    const resp = await client
      .patch('/api/v1/solicitudes-pago/999999/aprobar')
      .loginAs(generador)
      .json({})
    resp.assertStatus(403)

    const filas = await denegacionesDe(generador.id)
    assert.lengthOf(filas, 1)
    assert.equal(Number(filas[0].registro_id), 999999)
    const datos = datosNuevosDe(filas[0])
    assert.equal(datos.ruta, '/api/v1/solicitudes-pago/:id/aprobar')
    assert.equal(datos.metodo, 'PATCH')
    assert.equal(datos.rol, 'generador')
  })

  test('cada intento denegado deja su propia fila', async ({ client, assert }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm3')

    const r1 = await client
      .post('/api/v1/pagos')
      .loginAs(admin)
      .json({} as never)
    r1.assertStatus(403)
    const r2 = await client
      .post('/api/v1/causaciones/lote')
      .loginAs(admin)
      .json({} as never)
    r2.assertStatus(403)
    const r3 = await client.post('/api/v1/solicitudes-pago').loginAs(admin).json({})
    r3.assertStatus(403)

    const filas = await denegacionesDe(admin.id)
    assert.lengthOf(filas, 3)
    const rutas = filas.map((f) => datosNuevosDe(f).ruta as string).sort()
    assert.deepEqual(rutas, [
      '/api/v1/causaciones/lote',
      '/api/v1/pagos',
      '/api/v1/solicitudes-pago',
    ])
  })

  test('una petición permitida no registra denegación', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen4')
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm4')

    const r1 = await client.get('/api/v1/solicitudes-pago').loginAs(generador)
    r1.assertStatus(200)
    const r2 = await client.get('/api/v1/reportes/resumen').loginAs(admin)
    r2.assertStatus(200)

    assert.lengthOf(await denegacionesDe(generador.id), 0)
    assert.lengthOf(await denegacionesDe(admin.id), 0)
  })

  test('el Administrador ve las denegaciones en GET /audit-logs', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen5')
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm5')

    const denegado = await client
      .post('/api/v1/pagos')
      .loginAs(generador)
      .json({} as never)
    denegado.assertStatus(403)

    const resp = await client.get('/api/v1/audit-logs?accion=ACCESO_DENEGADO').loginAs(admin)
    resp.assertStatus(200)
    const datos = resp.body().data as Array<{ accion: string }>
    assert.isNotEmpty(datos)
    assert.isTrue(datos.every((fila) => fila.accion === 'ACCESO_DENEGADO'))
  })

  test('un 401 no se registra como denegación', async ({ client, assert }) => {
    const antes = await contarDenegaciones()

    const resp = await client.post('/api/v1/pagos').json({} as never)
    resp.assertStatus(401)

    assert.equal(await contarDenegaciones(), antes)
  })
})
