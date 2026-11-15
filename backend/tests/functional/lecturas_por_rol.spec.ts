import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Usuario from '#models/usuario'
import Persona from '#models/persona'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'
const ID_INEXISTENTE = 999999

/**
 * Listados con detalle financiero (ADR 0002): solo Generador y Receptor.
 */
const LISTADOS_DETALLE = [
  '/api/v1/causaciones',
  '/api/v1/deudas',
  '/api/v1/asignaciones',
  '/api/v1/solicitudes-pago',
  '/api/v1/pagos',
  '/api/v1/cajas-chicas',
]

/**
 * Rutas de detalle por ID con el código de error que devuelven si el ID no existe.
 */
const DETALLE_POR_ID = [
  { ruta: `/api/v1/solicitudes-pago/${ID_INEXISTENTE}`, codigo: 'SOLICITUD_NO_ENCONTRADA' },
  { ruta: `/api/v1/cajas-chicas/${ID_INEXISTENTE}`, codigo: 'CAJA_CHICA_NO_ENCONTRADA' },
  { ruta: `/api/v1/reportes/pagos/${ID_INEXISTENTE}/recibo.pdf`, codigo: 'PAGO_NO_ENCONTRADO' },
  {
    ruta: `/api/v1/reportes/solicitudes/${ID_INEXISTENTE}/consolidado.pdf`,
    codigo: 'SOLICITUD_NO_ENCONTRADA',
  },
]

/**
 * Lecturas abiertas a los tres roles: resumen agregado y catálogos.
 */
const LECTURAS_COMUNES = [
  '/api/v1/reportes/resumen',
  '/api/v1/personas',
  '/api/v1/proyectos',
  '/api/v1/grupos-pago',
]

/**
 * Crea un usuario operador con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `lec_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Siembra un beneficiario con identificación única para comprobar qué roles la ven en el resumen.
 */
async function crearPersona() {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  return Persona.create({
    identificacion: `V-RES-${sufijo}`,
    nombres: 'Beneficiaria',
    apellidos: 'Resumen',
    estaActivo: true,
  })
}

test.group('Lecturas por rol: detalle financiero (ADR 0002)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el Administrador recibe 403 en cada lectura de detalle financiero', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const rutas = [...LISTADOS_DETALLE, ...DETALLE_POR_ID.map((r) => r.ruta)]
    assert.isAtLeast(rutas.length, 9)

    for (const ruta of rutas) {
      const resp = await client.get(ruta).loginAs(admin)
      assert.equal(resp.status(), 403, `GET ${ruta} debía responder 403 al Administrador`)
      assert.include(resp.text(), 'detalle financiero', `GET ${ruta}: mensaje de denegación`)
      assert.notInclude(resp.text(), '"data"', `GET ${ruta}: no debe filtrar datos`)
    }
  })

  test('el Administrador lee el resumen, la auditoría y los catálogos', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const rutas = [...LECTURAS_COMUNES, '/api/v1/audit-logs', '/api/v1/usuarios']

    for (const ruta of rutas) {
      const resp = await client.get(ruta).loginAs(admin)
      assert.equal(resp.status(), 200, `GET ${ruta} debía responder 200 al Administrador`)
    }
  })

  for (const rol of [RolUsuario.GENERADOR, RolUsuario.RECEPTOR]) {
    test(`el rol ${rol} lee el detalle financiero, el resumen y los catálogos`, async ({
      client,
      assert,
    }) => {
      const usuario = await crearUsuario(rol, rol.slice(0, 3))

      for (const ruta of [...LISTADOS_DETALLE, ...LECTURAS_COMUNES]) {
        const resp = await client.get(ruta).loginAs(usuario)
        assert.equal(resp.status(), 200, `GET ${ruta} debía responder 200 a ${rol}`)
      }
      for (const ruta of LISTADOS_DETALLE) {
        const resp = await client.get(ruta).loginAs(usuario)
        assert.isArray((resp.body() as { data: unknown }).data, `GET ${ruta}: data`)
      }
      for (const { ruta, codigo } of DETALLE_POR_ID) {
        const resp = await client.get(ruta).loginAs(usuario)
        assert.equal(resp.status(), 404, `GET ${ruta} debía pasar la autorización (404)`)
        assert.equal((resp.body() as { codigo: string }).codigo, codigo)
      }
    })
  }
})

test.group('Lecturas por rol: contenido del resumen (ADR 0002, hallazgo A1)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('el Administrador recibe el resumen sin el desglose por beneficiario', async ({
    client,
    assert,
  }) => {
    const persona = await crearPersona()
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')

    const resp = await client.get('/api/v1/reportes/resumen').loginAs(admin)

    resp.assertStatus(200)
    const body = resp.body() as Record<string, unknown>
    assert.properties(body, ['kpis', 'porProyecto'])
    assert.isArray(body.porProyecto)
    assert.notProperty(body, 'porPersona', 'el Administrador no debe recibir porPersona')
    assert.notInclude(resp.text(), 'identificacion', 'sin identificaciones de beneficiarios')
    assert.notInclude(resp.text(), persona.identificacion, 'sin la identificación sembrada')
  })

  for (const rol of [RolUsuario.GENERADOR, RolUsuario.RECEPTOR]) {
    test(`el rol ${rol} recibe el desglose por beneficiario`, async ({ client, assert }) => {
      const persona = await crearPersona()
      const usuario = await crearUsuario(rol, rol.slice(0, 3))

      const resp = await client.get('/api/v1/reportes/resumen').loginAs(usuario)

      resp.assertStatus(200)
      const body = resp.body() as {
        porPersona: Array<{ identificacion: string; totalCausado: number }>
      }
      assert.isArray(body.porPersona)
      const fila = body.porPersona.find((p) => p.identificacion === persona.identificacion)
      assert.exists(fila, `porPersona debe incluir la persona sembrada para ${rol}`)
      assert.equal(fila!.totalCausado, 0)
    })
  }
})
