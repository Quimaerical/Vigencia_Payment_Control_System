import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Crea un usuario operador con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string, estaActivo = true) {
  return Usuario.create({
    username: `pen_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo,
  })
}

/**
 * Cuenta las filas de las tablas financieras que un ataque denegado no debe alterar.
 */
async function contarFilasFinancieras() {
  const tablas = ['pagos', 'deudas', 'solicitudes_pago', 'asignaciones', 'vales_caja'] as const
  const conteos: Record<string, number> = {}
  for (const tabla of tablas) {
    const fila = (await db.from(tabla).count('* as total').first()) as { total: string | number }
    conteos[tabla] = Number(fila.total)
  }
  return conteos
}

test.group('Penetración de roles: segregación de funciones por HTTP', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el Administrador no ejecuta operaciones de dinero ni deja filas', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const antes = await contarFilasFinancieras()

    const respPago = await client
      .post('/api/v1/pagos')
      .loginAs(admin)
      .json({} as never)
    respPago.assertStatus(403)
    const respLote = await client.post('/api/v1/causaciones/lote').loginAs(admin).json({})
    respLote.assertStatus(403)
    const respSolicitud = await client.post('/api/v1/solicitudes-pago').loginAs(admin).json({})
    respSolicitud.assertStatus(403)
    const respAprobar = await client
      .patch('/api/v1/solicitudes-pago/999999/aprobar')
      .loginAs(admin)
      .json({})
    respAprobar.assertStatus(403)

    assert.deepEqual(await contarFilasFinancieras(), antes)
  })

  test('el Generador no aprueba, no paga y no aprueba vales', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const antes = await contarFilasFinancieras()

    const respAprobar = await client
      .patch('/api/v1/solicitudes-pago/999999/aprobar')
      .loginAs(generador)
      .json({})
    respAprobar.assertStatus(403)
    const respPago = await client
      .post('/api/v1/pagos')
      .loginAs(generador)
      .json({} as never)
    respPago.assertStatus(403)
    const respVale = await client
      .patch('/api/v1/vales-caja/999999/aprobar')
      .loginAs(generador)
      .json({})
    respVale.assertStatus(403)

    assert.deepEqual(await contarFilasFinancieras(), antes)
  })

  test('el Receptor no causa, no crea solicitudes ni asignaciones', async ({ client, assert }) => {
    const receptor = await crearUsuario(RolUsuario.RECEPTOR, 'rec')
    const antes = await contarFilasFinancieras()

    const respLote = await client.post('/api/v1/causaciones/lote').loginAs(receptor).json({})
    respLote.assertStatus(403)
    const respSolicitud = await client.post('/api/v1/solicitudes-pago').loginAs(receptor).json({})
    respSolicitud.assertStatus(403)
    const respAsignacion = await client.post('/api/v1/asignaciones').loginAs(receptor).json({})
    respAsignacion.assertStatus(403)

    assert.deepEqual(await contarFilasFinancieras(), antes)
  })
})

test.group('Penetración de roles: tokens', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('usuario desactivado con token vigente recibe 403 USUARIO_INACTIVO', async ({
    client,
    assert,
  }) => {
    const receptor = await crearUsuario(RolUsuario.RECEPTOR, 'inact')
    const token = await Usuario.accessTokens.create(receptor)
    // Se desactiva directo en BD (no por la API, que borraría los tokens): simula una
    // desactivación que no revocó el token, el caso que debe frenar el middleware.
    receptor.estaActivo = false
    await receptor.save()

    const resp = await client
      .post('/api/v1/pagos')
      .bearerToken(token.value!.release())
      .json({} as never)
    resp.assertStatus(403)
    assert.equal((resp.body() as { codigo: string }).codigo, 'USUARIO_INACTIVO')
    const fila = (await db
      .from('pagos')
      .where('usuario_id', Number(receptor.id))
      .count('* as total')
      .first()) as { total: string | number }
    assert.equal(Number(fila.total), 0)
  })

  test('el token deja de servir tras POST /account/logout', async ({ client }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'logout')

    const respLogin = await client
      .post('/api/v1/auth/login')
      .json({ username: generador.username, password: CONTRASENA })
    respLogin.assertStatus(200)
    const cuerpo = respLogin.body() as {
      token?: string
      data?: { token?: string }
    }
    const bearer = (cuerpo.token ?? cuerpo.data?.token) as string

    const respPerfil = await client.get('/api/v1/account/perfil').bearerToken(bearer)
    respPerfil.assertStatus(200)
    const respLogout = await client.post('/api/v1/account/logout').bearerToken(bearer)
    respLogout.assertStatus(200)
    const respTrasLogout = await client.get('/api/v1/account/perfil').bearerToken(bearer)
    respTrasLogout.assertStatus(401)
  })

  test('token inventado y petición sin token reciben 401', async ({ client }) => {
    const respInventado = await client
      .get('/api/v1/account/perfil')
      .bearerToken('oat_MTIzNDU2.tokenInventadoPorElAtacante')
    respInventado.assertStatus(401)
    const respSinToken = await client.post('/api/v1/pagos').json({} as never)
    respSinToken.assertStatus(401)
  })

  test('token con expires_at en el pasado recibe 401 (ADR 0003)', async ({ client }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'vencido')
    const token = await Usuario.accessTokens.create(generador)
    await db
      .from('auth_access_tokens')
      .where('id', String(token.identifier))
      .update({ expires_at: DateTime.now().minus({ hours: 1 }).toJSDate() })

    const resp = await client.get('/api/v1/account/perfil').bearerToken(token.value!.release())
    resp.assertStatus(401)
  })
})
