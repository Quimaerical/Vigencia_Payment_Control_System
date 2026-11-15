import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { Env } from '@adonisjs/core/env'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'
import { NIVELES_LOG, validarNivelLog } from '#services/nivel_log'

const CONTRASENA = 'PasswordSeguro123!'
const CSP = "default-src 'none'; frame-ancestors 'none'"
const CUERPO_SIMULAR = { montoPeriodo: 300, diasActivos: 10, diasPeriodo: 15 }
const MOTIVO_GENERADOR =
  'Solo los usuarios con rol generador pueden gestionar proyectos, personas, asignaciones, causaciones y crear solicitudes'

/**
 * Crea un usuario operador con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `s11_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Devuelve `datos_nuevos` como objeto aunque el driver lo entregue como texto.
 */
function datosNuevosDe(fila: { datos_nuevos: unknown }) {
  return (
    typeof fila.datos_nuevos === 'string' ? JSON.parse(fila.datos_nuevos) : fila.datos_nuevos
  ) as Record<string, unknown>
}

test.group('Endurecimiento menor: simular solo Generador (B2)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el Administrador recibe 403 y la denegación queda auditada', async ({ client, assert }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')

    const resp = await client
      .post('/api/v1/causaciones/simular')
      .loginAs(admin)
      .json(CUERPO_SIMULAR)
    resp.assertStatus(403)

    const filas = await db
      .from('audit_logs')
      .where('accion', 'ACCESO_DENEGADO')
      .where('usuario_id', admin.id)
    assert.lengthOf(filas, 1)
    assert.deepEqual(datosNuevosDe(filas[0]), {
      metodo: 'POST',
      ruta: '/api/v1/causaciones/simular',
      rol: 'administrador',
      motivo: MOTIVO_GENERADOR,
    })
  })

  test('el Receptor recibe 403', async ({ client }) => {
    const receptor = await crearUsuario(RolUsuario.RECEPTOR, 'rec')
    const resp = await client
      .post('/api/v1/causaciones/simular')
      .loginAs(receptor)
      .json(CUERPO_SIMULAR)
    resp.assertStatus(403)
  })

  test('autoriza antes de validar: cuerpo inválido de un Admin da 403, no 422', async ({
    client,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm422')
    const resp = await client.post('/api/v1/causaciones/simular').loginAs(admin).json({})
    resp.assertStatus(403)
  })

  test('el Generador sigue simulando', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const resp = await client
      .post('/api/v1/causaciones/simular')
      .loginAs(generador)
      .json(CUERPO_SIMULAR)
    resp.assertStatus(200)
    assert.equal((resp.body() as { montoCausado: number }).montoCausado, 200)
  })
})

test.group('Endurecimiento menor: cabeceras de seguridad (B3)', () => {
  test('una respuesta 200 lleva CSP, Referrer-Policy y nosniff', async ({ client }) => {
    const resp = await client.get('/')
    resp.assertStatus(200)
    resp.assertHeader('content-security-policy', CSP)
    resp.assertHeader('referrer-policy', 'no-referrer')
    resp.assertHeader('x-content-type-options', 'nosniff')
  })

  test('un 401 sin token lleva CSP y Referrer-Policy', async ({ client }) => {
    const resp = await client.get('/api/v1/personas')
    resp.assertStatus(401)
    resp.assertHeader('content-security-policy', CSP)
    resp.assertHeader('referrer-policy', 'no-referrer')
  })

  test('un 404 de ruta inexistente lleva CSP y Referrer-Policy', async ({ client }) => {
    const resp = await client.get('/no-existe-s11')
    resp.assertStatus(404)
    resp.assertHeader('content-security-policy', CSP)
    resp.assertHeader('referrer-policy', 'no-referrer')
  })
})

test.group('Endurecimiento menor: LOG_LEVEL acotado (B4)', () => {
  test('debug, trace y silent abortan en producción', ({ assert }) => {
    for (const nivel of ['debug', 'trace', 'silent'] as const) {
      assert.throws(() => validarNivelLog('production', nivel), `LOG_LEVEL=${nivel}`)
    }
  })

  test('los niveles permitidos no lanzan', ({ assert }) => {
    assert.doesNotThrow(() => validarNivelLog('production', 'info'))
    assert.doesNotThrow(() => validarNivelLog('production', 'warn'))
    assert.doesNotThrow(() => validarNivelLog('development', 'debug'))
    assert.doesNotThrow(() => validarNivelLog('test', 'silent'))
  })

  test('la enum de LOG_LEVEL rechaza valores fuera de pino', ({ assert }) => {
    const validar = Env.schema.enum(NIVELES_LOG)
    assert.throws(() => validar('LOG_LEVEL', 'verbose'))
    assert.equal(validar('LOG_LEVEL', 'info'), 'info')
  })
})
