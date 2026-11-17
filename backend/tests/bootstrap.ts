import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import ace from '@adonisjs/core/services/ace'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import type { Registry } from '../.adonisjs/client/registry/schema.d.ts'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */
declare module '@japa/api-client/types' {
  interface RoutesRegistry extends Registry {}
}

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  apiClient(),
  sessionApiClient(app),
  authApiClient(app),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
/**
 * Prepara la base de datos de pruebas antes de toda la suite (ADR 0010).
 * Aborta sin tocar nada si la conexión no apunta a una base terminada en `_test`
 * o si hay una `DATABASE_URL` definida (podría ser Neon o Railway). Después recrea
 * el esquema completo con `migration:fresh`, incluidos triggers y tipos ENUM, para
 * que cada ejecución parta de una base limpia; los datos que dejan las pruebas de
 * concurrencia (inmutables por diseño) se descartan aquí en la siguiente ejecución.
 */
async function prepararBaseDePruebas() {
  const nombreBd = env.get('DB_DATABASE') ?? ''
  const urlBd = env.get('DATABASE_URL')

  if (urlBd || !nombreBd.endsWith('_test')) {
    throw new Error(
      `Pruebas abortadas: la base de datos debe terminar en "_test" y DATABASE_URL debe ` +
        `estar vacía (DB_DATABASE="${nombreBd}", DATABASE_URL ${urlBd ? 'definida' : 'vacía'}). ` +
        `No se ejecutó ninguna migración.`
    )
  }

  const comando = await ace.exec('migration:fresh', ['--drop-types'])
  if (comando.exitCode !== 0) {
    throw comando.error ?? new Error('migration:fresh falló sobre la base de pruebas')
  }
}

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [prepararBaseDePruebas],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
