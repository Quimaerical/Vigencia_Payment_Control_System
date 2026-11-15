import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

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
