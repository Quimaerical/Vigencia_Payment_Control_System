import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

/**
 * Pide GET / con el origen indicado y devuelve la cabecera Access-Control-Allow-Origin.
 */
async function acaoPara(client: ApiClient, origen: string) {
  const resp = await client.get('/').header('Origin', origen)
  return resp.header('access-control-allow-origin') as string | undefined
}

test.group('Endurecimiento auth: CORS (ADR 0005 y 0013)', () => {
  test('un origen ajeno en vercel.app no recibe Access-Control-Allow-Origin', async ({
    client,
    assert,
  }) => {
    assert.isUndefined(await acaoPara(client, 'https://atacante.vercel.app'))
  })

  test('un proyecto homónimo con prefijo falso no recibe Access-Control-Allow-Origin', async ({
    client,
    assert,
  }) => {
    assert.isUndefined(await acaoPara(client, 'https://vigencia-frontend-falso.vercel.app'))
  })

  test('un sufijo engañoso no recibe Access-Control-Allow-Origin', async ({ client, assert }) => {
    assert.isUndefined(
      await acaoPara(
        client,
        'https://vigencia-frontend-abc-equipo-vigencia.vercel.app.atacante.com'
      )
    )
  })

  test('un origen exacto configurado recibe su Access-Control-Allow-Origin', async ({
    client,
    assert,
  }) => {
    assert.equal(
      await acaoPara(client, 'https://vigencia.example.com'),
      'https://vigencia.example.com'
    )
  })

  test('un preview del proyecto y del equipo recibe Access-Control-Allow-Origin', async ({
    client,
    assert,
  }) => {
    const origen = 'https://vigencia-frontend-git-feat-login-equipo-vigencia.vercel.app'
    assert.equal(await acaoPara(client, origen), origen)
  })

  test('localhost se acepta fuera de producción', async ({ client, assert }) => {
    assert.equal(await acaoPara(client, 'http://localhost:5173'), 'http://localhost:5173')
  })

  test('no hay credenciales ni Authorization expuesta, y sí Retry-After', async ({
    client,
    assert,
  }) => {
    const resp = await client.get('/').header('Origin', 'https://vigencia.example.com')
    assert.isUndefined(resp.header('access-control-allow-credentials'))
    const expuestas = String(resp.header('access-control-expose-headers') ?? '').toLowerCase()
    assert.notInclude(expuestas, 'authorization')
    assert.include(expuestas, 'retry-after')
  })

  test('el preflight de un origen ajeno no recibe Access-Control-Allow-Origin', async ({
    client,
    assert,
  }) => {
    const resp = await client
      .options('/api/v1/auth/login')
      .header('Origin', 'https://atacante.vercel.app')
      .header('Access-Control-Request-Method', 'POST')
    assert.isUndefined(resp.header('access-control-allow-origin'))
  })

  test('sin Origin la API responde', async ({ client }) => {
    const resp = await client.get('/')
    resp.assertStatus(200)
  })
})

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Crea un usuario activo con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `end_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Inicia sesión por HTTP y devuelve el Bearer emitido (acepta `token` o `data.token`).
 */
async function iniciarSesion(client: ApiClient, username: string) {
  const resp = await client.post('/api/v1/auth/login').json({ username, password: CONTRASENA })
  resp.assertStatus(200)
  const cuerpo = resp.body() as { token?: string; data?: { token?: string } }
  return (cuerpo.token ?? cuerpo.data?.token) as string
}

/**
 * Fija expires_at de los tokens del usuario (para simular el paso del tiempo).
 */
async function fijarExpiracion(usuarioId: number, fecha: DateTime) {
  await db
    .from('auth_access_tokens')
    .where('tokenable_id', usuarioId)
    .update({ expires_at: fecha.toJSDate() })
}

test.group('Endurecimiento auth: expiración de tokens (ADR 0003)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el login emite un token que vence en 8 horas', async ({ client, assert }) => {
    const usuario = await crearUsuario(RolUsuario.GENERADOR, 'exp8h')
    await iniciarSesion(client, usuario.username)

    const fila = await db
      .from('auth_access_tokens')
      .where('tokenable_id', usuario.id)
      .orderBy('id', 'desc')
      .firstOrFail()
    const vence = DateTime.fromJSDate(new Date(fila.expires_at))

    assert.isTrue(vence > DateTime.now().plus({ hours: 7, minutes: 59 }))
    assert.isTrue(vence < DateTime.now().plus({ hours: 8, minutes: 1 }))
  })

  test('un token del login con expires_at pasado recibe 401', async ({ client }) => {
    const usuario = await crearUsuario(RolUsuario.GENERADOR, 'vencido')
    const bearer = await iniciarSesion(client, usuario.username)
    await fijarExpiracion(usuario.id, DateTime.now().minus({ minutes: 1 }))

    const resp = await client.get('/api/v1/account/perfil').bearerToken(bearer)
    resp.assertStatus(401)
  })

  test('un token a 1 minuto de vencer sigue sirviendo', async ({ client }) => {
    const usuario = await crearUsuario(RolUsuario.GENERADOR, 'vigente')
    const bearer = await iniciarSesion(client, usuario.username)
    await fijarExpiracion(usuario.id, DateTime.now().plus({ minutes: 1 }))

    const resp = await client.get('/api/v1/account/perfil').bearerToken(bearer)
    resp.assertStatus(200)
  })
})
