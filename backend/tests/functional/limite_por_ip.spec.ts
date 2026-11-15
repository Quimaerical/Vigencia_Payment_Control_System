import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import Usuario from '#models/usuario'
import { LIMITES_POR_IP } from '#middleware/limite_peticiones_middleware'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'
const CLAVE_ERRONEA = 'ClaveIncorrecta999'

/**
 * Crea un usuario activo con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `ip_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Intenta iniciar sesión desde la IP simulada indicada (X-Forwarded-For se acepta porque
 * el cliente de pruebas llega por loopback, ADR 0011) y devuelve la respuesta.
 */
async function intentarLogin(client: ApiClient, username: string, password: string, ip: string) {
  return client
    .post('/api/v1/auth/login')
    .header('X-Forwarded-For', ip)
    .json({ username, password })
}

/**
 * Cuerpo de la respuesta sin tipar: las respuestas 429 no están en los tipos de las rutas.
 */
function cuerpo(resp: { body(): unknown }) {
  return resp.body() as any
}

/**
 * Gasta el límite de login de una IP con usernames inexistentes distintos (*spraying*), de
 * modo que ninguna cuenta acumule fallos. Cada intento debe responder 400.
 */
async function agotarLoginPorIp(client: ApiClient, assert: any, ip: string) {
  for (let i = 0; i < LIMITES_POR_IP.login.requests; i++) {
    const resp = await intentarLogin(client, `spray_${i}_${Date.now()}`, CLAVE_ERRONEA, ip)
    assert.equal(resp.status(), 400)
  }
}

/**
 * Gasta el límite general de una IP con peticiones sin token (cada una responde 401).
 */
async function agotarLimiteGeneral(client: ApiClient, assert: any, ip: string) {
  for (let i = 0; i < LIMITES_POR_IP.api.requests; i++) {
    const resp = await client.get('/api/v1/account/perfil').header('X-Forwarded-For', ip)
    assert.equal(resp.status(), 401)
  }
}

test.group('Límite por IP en login y en /api/v1 (ADR 0018)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.teardown(() => limiter.clear(['memory']))

  test('el spraying desde una IP se corta aunque ninguna cuenta llegue a 5 fallos', async ({
    client,
    assert,
  }) => {
    await agotarLoginPorIp(client, assert, '192.0.2.21')

    const resp = await intentarLogin(
      client,
      `spray_final_${Date.now()}`,
      CLAVE_ERRONEA,
      '192.0.2.21'
    )
    resp.assertStatus(429)
    assert.equal(cuerpo(resp).codigo, 'DEMASIADOS_INTENTOS')
    assert.isAbove(cuerpo(resp).reintentarEn, 0)
    assert.isAbove(Number(resp.header('retry-after')), 0)
  })

  test('una IP bloqueada no entra ni con la contraseña correcta', async ({ client, assert }) => {
    const usuario = await crearUsuario(RolUsuario.RECEPTOR, 'bloq')
    await agotarLoginPorIp(client, assert, '192.0.2.22')

    const resp = await intentarLogin(client, usuario.username, CONTRASENA, '192.0.2.22')
    resp.assertStatus(429)
    assert.equal(cuerpo(resp).codigo, 'DEMASIADOS_INTENTOS')
  })

  test('otra IP no se ve afectada por el bloqueo', async ({ client, assert }) => {
    const usuario = await crearUsuario(RolUsuario.RECEPTOR, 'otraip')
    await agotarLoginPorIp(client, assert, '192.0.2.23')

    const resp = await intentarLogin(client, usuario.username, CONTRASENA, '198.51.100.23')
    resp.assertStatus(200)
    const datos = cuerpo(resp)
    assert.isString(datos.token ?? datos.data?.token)
  })

  test('el límite general corta antes de autenticar', async ({ client, assert }) => {
    await agotarLimiteGeneral(client, assert, '192.0.2.24')

    const resp = await client.get('/api/v1/account/perfil').header('X-Forwarded-For', '192.0.2.24')
    resp.assertStatus(429)
    assert.equal(cuerpo(resp).codigo, 'DEMASIADAS_PETICIONES')
    assert.isAbove(cuerpo(resp).reintentarEn, 0)
    assert.isAbove(Number(resp.header('retry-after')), 0)
  })

  test('el límite general es por IP', async ({ client, assert }) => {
    await agotarLimiteGeneral(client, assert, '192.0.2.25')

    const resp = await client
      .get('/api/v1/account/perfil')
      .header('X-Forwarded-For', '198.51.100.25')
    resp.assertStatus(401)
  })

  test('el límite general no rompe el uso autenticado normal', async ({ client }) => {
    const usuario = await crearUsuario(RolUsuario.GENERADOR, 'normal')

    for (let i = 0; i < 10; i++) {
      const resp = await client
        .get('/api/v1/account/perfil')
        .header('X-Forwarded-For', '192.0.2.26')
        .loginAs(usuario)
      resp.assertStatus(200)
    }
  })
})
