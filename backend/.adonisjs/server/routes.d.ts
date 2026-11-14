import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.registro': { paramsTuple?: []; params?: {} }
    'auth.signup': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'pagos.procesar': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'account.perfil': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.registro': { paramsTuple?: []; params?: {} }
    'auth.signup': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'pagos.procesar': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}