import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'
import type { InferLimiters } from '@adonisjs/limiter/types'

/**
 * Configuración del límite de peticiones (ADR 0004). Sin Redis: los contadores viven en
 * PostgreSQL para compartirse entre instancias y sobrevivir a reinicios. La memoria solo
 * se usa en pruebas.
 */
const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),

  stores: {
    /**
     * Contadores en la tabla rate_limits de la conexión por defecto.
     */
    database: stores.database({
      tableName: 'rate_limits',
    }),

    /**
     * Contadores en memoria del proceso, solo para pruebas.
     */
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
