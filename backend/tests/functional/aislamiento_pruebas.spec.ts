import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Aislamiento de la base de pruebas (ADR 0010)', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  /**
   * Comprueba que la suite está conectada a una base terminada en `_test` y nunca a la de
   * desarrollo (`vigencia_db`) ni a una remota.
   */
  test('la conexión apunta a una base de datos terminada en _test', async ({ assert }) => {
    const resultado = await db.rawQuery('SELECT current_database() AS nombre')
    const nombre: string = resultado.rows[0].nombre

    assert.match(nombre, /_test$/)
    assert.notEqual(nombre, 'vigencia_db')
  })
})
