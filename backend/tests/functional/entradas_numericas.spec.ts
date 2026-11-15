import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Una ruta con :id por controlador (método + plantilla). ':id' se sustituye por el valor a probar.
 */
const RUTAS_CON_ID = [
  { metodo: 'PATCH', ruta: '/api/v1/usuarios/:id/estado' },
  { metodo: 'PUT', ruta: '/api/v1/personas/:id' },
  { metodo: 'PUT', ruta: '/api/v1/proyectos/:id' },
  { metodo: 'PUT', ruta: '/api/v1/grupos-pago/:id' },
  { metodo: 'PUT', ruta: '/api/v1/asignaciones/:id' },
  { metodo: 'POST', ruta: '/api/v1/causaciones/:id/anular' },
  { metodo: 'GET', ruta: '/api/v1/solicitudes-pago/:id' },
  { metodo: 'POST', ruta: '/api/v1/pagos/:id/anular' },
  { metodo: 'GET', ruta: '/api/v1/cajas-chicas/:id' },
  { metodo: 'PATCH', ruta: '/api/v1/vales-caja/:id/aprobar' },
  { metodo: 'GET', ruta: '/api/v1/reportes/pagos/:id/recibo.pdf' },
]

/**
 * Ids que no deben llegar a PostgreSQL: texto, cero, negativo, decimal, ceros a la izquierda,
 * desbordamiento de INTEGER y el literal NaN.
 */
const IDS_INVALIDOS = ['abc', '0', '-1', '1.5', '007', '9999999999', 'NaN', '1abc']

/**
 * Listados con filtros numéricos y los campos que acepta cada uno.
 */
const LISTADOS_CON_FILTROS = [
  { ruta: '/api/v1/causaciones', campos: ['proyectoId', 'personaId', 'solicitudId'] },
  { ruta: '/api/v1/deudas', campos: ['proyectoId', 'personaId', 'solicitudId'] },
  { ruta: '/api/v1/asignaciones', campos: ['proyectoId', 'personaId', 'grupoPagoId'] },
  { ruta: '/api/v1/solicitudes-pago', campos: ['proyectoId'] },
  { ruta: '/api/v1/pagos', campos: ['personaId', 'solicitudId'] },
  { ruta: '/api/v1/cajas-chicas', campos: ['proyectoId'] },
]

/**
 * Valores de filtro inválidos: texto, vacío, cero, decimal y desbordamiento de INTEGER.
 */
const FILTROS_INVALIDOS = ['x', '', '0', '1.5', '2147483648']

/**
 * Crea un usuario operador con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `num_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Campos que VineJS marca como inválidos en una respuesta 422.
 */
function camposConError(cuerpo: unknown): string[] {
  return ((cuerpo as { errors?: { field: string }[] }).errors ?? []).map((e) => e.field)
}

test.group('Entradas numéricas (M1, ADR 0015)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('un id inválido en la ruta responde 404, nunca 500', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')

    for (const { metodo, ruta } of RUTAS_CON_ID) {
      for (const id of IDS_INVALIDOS) {
        const rutaFinal = ruta.replace(':id', id)
        const resp = await client.request(rutaFinal, metodo).loginAs(generador)
        assert.equal(resp.status(), 404, `${metodo} ${rutaFinal}`)
        assert.notInclude(resp.text(), '22P02')
        assert.notInclude(resp.text(), '22003')
      }
    }
  })

  test('el id máximo aceptado llega al controlador y da el 404 de negocio', async ({
    client,
    assert,
  }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const resp = await client.get('/api/v1/solicitudes-pago/999999999').loginAs(generador)
    assert.equal(resp.status(), 404)
    assert.equal((resp.body() as { codigo: string }).codigo, 'SOLICITUD_NO_ENCONTRADA')
  })

  test('un filtro numérico inválido responde 422 con el campo', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')

    for (const { ruta, campos } of LISTADOS_CON_FILTROS) {
      for (const campo of campos) {
        for (const valor of FILTROS_INVALIDOS) {
          const url = `${ruta}?${campo}=${encodeURIComponent(valor)}`
          const resp = await client.get(url).loginAs(generador)
          assert.equal(resp.status(), 422, `GET ${url}`)
          assert.include(camposConError(resp.body()), campo, `GET ${url}`)
        }
      }
    }
  })

  test('un filtro válido se aplica y no rompe', async ({ client, assert }) => {
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')

    for (const { ruta, campos } of LISTADOS_CON_FILTROS) {
      const query = campos.map((c) => `${c}=999999999`).join('&')
      const resp = await client.get(`${ruta}?${query}`).loginAs(generador)
      assert.equal(resp.status(), 200, `GET ${ruta}?${query}`)
      assert.deepEqual((resp.body() as { data: unknown }).data, [], `GET ${ruta}?${query}`)
    }
  })

  test('el Administrador recibe 403 antes que 422', async ({ client, assert }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const resp = await client.get('/api/v1/pagos?personaId=x').loginAs(admin)
    assert.equal(resp.status(), 403)
  })

  test('sin token, el filtro inválido da 401', async ({ client, assert }) => {
    const resp = await client.get('/api/v1/pagos?personaId=x')
    assert.equal(resp.status(), 401)
  })

  test('audit-logs: filtros inválidos responden 422', async ({ client, assert }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const casos = [
      { query: 'usuarioId=x', campo: 'usuarioId' },
      { query: 'limite=0', campo: 'limite' },
      { query: 'limite=501', campo: 'limite' },
      { query: 'limite=abc', campo: 'limite' },
    ]

    for (const { query, campo } of casos) {
      const resp = await client.get(`/api/v1/audit-logs?${query}`).loginAs(admin)
      assert.equal(resp.status(), 422, `GET audit-logs?${query}`)
      assert.include(camposConError(resp.body()), campo, `GET audit-logs?${query}`)
    }
  })

  test('audit-logs: el límite válido se respeta', async ({ client, assert }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')

    const conLimite = await client.get('/api/v1/audit-logs?limite=2').loginAs(admin)
    assert.equal(conLimite.status(), 200)
    assert.isAtMost((conLimite.body() as { data: unknown[] }).data.length, 2)

    const sinParametros = await client.get('/api/v1/audit-logs').loginAs(admin)
    assert.equal(sinParametros.status(), 200)
  })
})
