/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.registro': {
    methods: ["POST"],
    pattern: '/api/v1/auth/registro',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"registro"]],
    types: placeholder as Registry['auth.registro']['types'],
  },
  'auth.signup': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.signup']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.login']['types'],
  },
  'account.perfil': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/perfil',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"perfil"]],
    types: placeholder as Registry['account.perfil']['types'],
  },
  'account.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['account.profile']['types'],
  },
  'account.logout': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['account.logout']['types'],
  },
  'pagos.procesar': {
    methods: ["POST"],
    pattern: '/api/v1/pagos',
    tokens: [[0,"api"],[0,"v1"],[0,"pagos"]],
    types: placeholder as Registry['pagos.procesar']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
