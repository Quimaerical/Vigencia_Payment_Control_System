/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    registro: typeof routes['auth.registro']
    signup: typeof routes['auth.signup']
    login: typeof routes['auth.login']
  }
  account: {
    perfil: typeof routes['account.perfil']
    profile: typeof routes['account.profile']
    logout: typeof routes['account.logout']
  }
  pagos: {
    procesar: typeof routes['pagos.procesar']
  }
}
