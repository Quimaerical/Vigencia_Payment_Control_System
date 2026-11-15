import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Usuario from '#models/usuario'
import Persona from '#models/persona'
import { RolUsuario } from '@app/shared'

const CONTRASENA = 'PasswordSeguro123!'

/**
 * Listados paginados y el rol que puede leerlos (usuarios: solo Administrador).
 */
const LISTADOS = [
  { ruta: '/api/v1/usuarios', rol: RolUsuario.ADMINISTRADOR },
  { ruta: '/api/v1/personas', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/proyectos', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/grupos-pago', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/asignaciones', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/causaciones', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/deudas', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/solicitudes-pago', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/pagos', rol: RolUsuario.GENERADOR },
  { ruta: '/api/v1/cajas-chicas', rol: RolUsuario.GENERADOR },
]

/**
 * Valores inválidos de página y de límite (texto, cero, negativo, decimal, desbordamiento).
 */
const PAGINAS_INVALIDAS = ['0', '-1', '1.5', 'x', '2147483648']
const LIMITES_INVALIDOS = ['0', '1.5', 'x']

interface CuerpoPaginado {
  data: { id: number }[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

/**
 * Crea un usuario con el rol indicado y un nombre único por prueba.
 */
async function crearUsuario(rol: RolUsuario, etiqueta: string) {
  return Usuario.create({
    username: `pag_${etiqueta}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    passwordHash: CONTRASENA,
    rol,
    estaActivo: true,
  })
}

/**
 * Crea n personas con identificación única para la prueba.
 */
async function crearPersonas(n: number) {
  const sufijo = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  await Persona.createMany(
    Array.from({ length: n }, (_, i) => ({
      identificacion: `V-PAG-${sufijo}-${i}`,
      nombres: 'Pag',
      apellidos: `N${i}`,
      estaActivo: true,
    }))
  )
}

/**
 * Campos que VineJS marca como inválidos en una respuesta 422.
 */
function camposConError(cuerpo: unknown): string[] {
  return ((cuerpo as { errors?: { field: string }[] }).errors ?? []).map((e) => e.field)
}

test.group('Paginación de listados (B1, ADR 0019)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('sin parámetros responde la forma paginada con los valores por defecto', async ({
    client,
    assert,
  }) => {
    for (const { ruta, rol } of LISTADOS) {
      const usuario = await crearUsuario(rol, 'def')
      const resp = await client.get(ruta).loginAs(usuario)
      assert.equal(resp.status(), 200, ruta)
      const body = resp.body() as CuerpoPaginado
      assert.isTrue(Array.isArray(body.data), ruta)
      assert.equal(typeof body.total, 'number', ruta)
      assert.equal(body.pagina, 1, ruta)
      assert.equal(body.limite, 20, ruta)
      assert.equal(body.totalPaginas, Math.ceil(body.total / 20), ruta)
      assert.isAtMost(body.data.length, 20, ruta)
    }
  })

  test('un límite por encima de 100 responde 422 en todos los listados', async ({
    client,
    assert,
  }) => {
    for (const { ruta, rol } of LISTADOS) {
      const usuario = await crearUsuario(rol, 'lim')
      for (const limite of [101, 100000]) {
        const resp = await client.get(ruta).qs({ limite }).loginAs(usuario)
        assert.equal(resp.status(), 422, `${ruta}?limite=${limite}`)
        assert.include(camposConError(resp.body()), 'limite', `${ruta}?limite=${limite}`)
      }
    }
  })

  test('página y límite inválidos responden 422, nunca 500', async ({ client, assert }) => {
    for (const { ruta, rol } of LISTADOS) {
      const usuario = await crearUsuario(rol, 'inv')
      for (const pagina of PAGINAS_INVALIDAS) {
        const resp = await client.get(ruta).qs({ pagina }).loginAs(usuario)
        assert.equal(resp.status(), 422, `${ruta}?pagina=${pagina}`)
        assert.include(camposConError(resp.body()), 'pagina', `${ruta}?pagina=${pagina}`)
        assert.notInclude(resp.text(), '22P02')
        assert.notInclude(resp.text(), '22003')
      }
      for (const limite of LIMITES_INVALIDOS) {
        const resp = await client.get(ruta).qs({ limite }).loginAs(usuario)
        assert.equal(resp.status(), 422, `${ruta}?limite=${limite}`)
        assert.include(camposConError(resp.body()), 'limite', `${ruta}?limite=${limite}`)
        assert.notInclude(resp.text(), '22P02')
        assert.notInclude(resp.text(), '22003')
      }
    }
  })

  test('con más de 100 filas nunca devuelve más de 100', async ({ client, assert }) => {
    await crearPersonas(120)
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const resp = await client.get('/api/v1/personas').qs({ limite: 100 }).loginAs(generador)
    assert.equal(resp.status(), 200)
    const body = resp.body() as CuerpoPaginado
    assert.equal(body.data.length, 100)
    assert.isAtLeast(body.total, 120)
    assert.equal(body.totalPaginas, Math.ceil(body.total / 100))
  })

  test('las páginas no se solapan y siguen el orden por id', async ({ client, assert }) => {
    await crearPersonas(25)
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const r1 = await client.get('/api/v1/personas').qs({ pagina: 1, limite: 10 }).loginAs(generador)
    const r2 = await client.get('/api/v1/personas').qs({ pagina: 2, limite: 10 }).loginAs(generador)
    const p1 = (r1.body() as CuerpoPaginado).data.map((f) => f.id)
    const p2 = (r2.body() as CuerpoPaginado).data.map((f) => f.id)
    assert.lengthOf(p1, 10)
    assert.lengthOf(p2, 10)
    assert.isEmpty(p2.filter((id) => p1.includes(id)))
    assert.deepEqual(
      p1,
      [...p1].sort((a, b) => a - b)
    )
    assert.isBelow(Math.max(...p1), Math.min(...p2))
  })

  test('una página más allá de la última responde vacía, no error', async ({ client, assert }) => {
    await crearPersonas(25)
    const generador = await crearUsuario(RolUsuario.GENERADOR, 'gen')
    const primera = await client.get('/api/v1/personas').qs({ limite: 10 }).loginAs(generador)
    const { totalPaginas, total } = primera.body() as CuerpoPaginado
    const resp = await client
      .get('/api/v1/personas')
      .qs({ pagina: totalPaginas + 1, limite: 10 })
      .loginAs(generador)
    assert.equal(resp.status(), 200)
    const body = resp.body() as CuerpoPaginado
    assert.deepEqual(body.data, [])
    assert.equal(body.total, total)
    assert.equal(body.pagina, totalPaginas + 1)
  })

  test('el Administrador sigue recibiendo 403 (no 422) en un listado financiero con límite inválido', async ({
    client,
    assert,
  }) => {
    const admin = await crearUsuario(RolUsuario.ADMINISTRADOR, 'adm')
    const resp = await client.get('/api/v1/pagos?limite=101').loginAs(admin)
    assert.equal(resp.status(), 403)
    assert.notInclude(resp.text(), '"data"')
  })
})
