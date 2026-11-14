/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.registro': {
    methods: ["POST"]
    pattern: '/api/v1/auth/registro'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.signup': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['registro']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.perfil': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/perfil'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
    }
  }
  'account.profile': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['perfil']>>>
    }
  }
  'account.logout': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['logout']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sesiones_controller').default['logout']>>>
    }
  }
  'pagos.procesar': {
    methods: ["POST"]
    pattern: '/api/v1/pagos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pago').procesarPagoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/pago').procesarPagoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['procesarPago']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['procesarPago']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['procesarPago']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
