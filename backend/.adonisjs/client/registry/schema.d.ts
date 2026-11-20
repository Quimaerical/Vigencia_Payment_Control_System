/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
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
  'usuarios.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/usuarios'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').paginacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'usuarios.crear': {
    methods: ["POST"]
    pattern: '/api/v1/usuarios'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').crearUsuarioAdminValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').crearUsuarioAdminValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'usuarios.estado': {
    methods: ["PATCH"]
    pattern: '/api/v1/usuarios/:id/estado'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['cambiarEstado']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/usuarios_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'personas.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/personas'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').paginacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'personas.crear': {
    methods: ["POST"]
    pattern: '/api/v1/personas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').crearPersonaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').crearPersonaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'personas.actualizar': {
    methods: ["PUT"]
    pattern: '/api/v1/personas/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').actualizarPersonaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').actualizarPersonaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['actualizar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'personas.estado': {
    methods: ["PATCH"]
    pattern: '/api/v1/personas/:id/estado'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['cambiarEstado']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/personas_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'proyectos.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/proyectos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').paginacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'proyectos.crear': {
    methods: ["POST"]
    pattern: '/api/v1/proyectos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').crearProyectoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').crearProyectoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'proyectos.actualizar': {
    methods: ["PUT"]
    pattern: '/api/v1/proyectos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').actualizarProyectoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').actualizarProyectoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['actualizar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'proyectos.estado': {
    methods: ["PATCH"]
    pattern: '/api/v1/proyectos/:id/estado'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['cambiarEstado']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/proyectos_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'grupos_pago.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/grupos-pago'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').paginacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'grupos_pago.crear': {
    methods: ["POST"]
    pattern: '/api/v1/grupos-pago'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').crearGrupoPagoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').crearGrupoPagoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'grupos_pago.actualizar': {
    methods: ["PUT"]
    pattern: '/api/v1/grupos-pago/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').actualizarGrupoPagoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').actualizarGrupoPagoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['actualizar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'grupos_pago.estado': {
    methods: ["PATCH"]
    pattern: '/api/v1/grupos-pago/:id/estado'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['cambiarEstado']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/grupos_pago_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'asignaciones.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/asignaciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'asignaciones.crear': {
    methods: ["POST"]
    pattern: '/api/v1/asignaciones'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').crearAsignacionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').crearAsignacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'asignaciones.actualizar': {
    methods: ["PUT"]
    pattern: '/api/v1/asignaciones/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogo').actualizarAsignacionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogo').actualizarAsignacionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['actualizar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['actualizar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'asignaciones.estado': {
    methods: ["PATCH"]
    pattern: '/api/v1/asignaciones/:id/estado'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').cambiarEstadoActivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['cambiarEstado']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/asignaciones_controller').default['cambiarEstado']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'causaciones.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/causaciones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deudas.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/deudas'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'causaciones.simular': {
    methods: ["POST"]
    pattern: '/api/v1/causaciones/simular'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').simularProrrateoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').simularProrrateoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['simular']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['simular']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['simular']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'causaciones.lote': {
    methods: ["POST"]
    pattern: '/api/v1/causaciones/lote'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').generarCausacionLoteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').generarCausacionLoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['generarLote']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['generarLote']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['generarLote']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'causaciones.anular': {
    methods: ["POST"]
    pattern: '/api/v1/causaciones/:id/anular'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deudas.anular': {
    methods: ["POST"]
    pattern: '/api/v1/deudas/:id/anular'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/causaciones_controller').default['anular']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'solicitudes_pago.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/solicitudes-pago'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'solicitudes_pago.mostrar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/solicitudes-pago/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['mostrar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['mostrar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['mostrar']>>>
    }
  }
  'solicitudes_pago.crear': {
    methods: ["POST"]
    pattern: '/api/v1/solicitudes-pago'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').crearSolicitudPagoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').crearSolicitudPagoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['crear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['crear']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'solicitudes_pago.enviar': {
    methods: ["PATCH"]
    pattern: '/api/v1/solicitudes-pago/:id/enviar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['enviar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['enviar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['enviar']>>>
    }
  }
  'solicitudes_pago.aprobar': {
    methods: ["PATCH"]
    pattern: '/api/v1/solicitudes-pago/:id/aprobar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['aprobar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['aprobar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['aprobar']>>>
    }
  }
  'solicitudes_pago.rechazar': {
    methods: ["PATCH"]
    pattern: '/api/v1/solicitudes-pago/:id/rechazar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').rechazarConMotivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').rechazarConMotivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['rechazar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['rechazar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['rechazar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'solicitudes_pago.cerrar': {
    methods: ["PATCH"]
    pattern: '/api/v1/solicitudes-pago/:id/cerrar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['cerrar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['cerrar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/solicitudes_pago_controller').default['cerrar']>>>
    }
  }
  'pagos.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/pagos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'pagos.anular': {
    methods: ["POST"]
    pattern: '/api/v1/pagos/:id/anular'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pago').anularPagoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pago').anularPagoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['anularPago']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['anularPago']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pagos_controller').default['anularPago']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cajas_chicas.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/cajas-chicas'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosListadoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['listar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['listar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cajas_chicas.mostrar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/cajas-chicas/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['mostrar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['mostrar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['mostrar']>>>
    }
  }
  'cajas_chicas.abrir': {
    methods: ["POST"]
    pattern: '/api/v1/cajas-chicas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').abrirCajaChicaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').abrirCajaChicaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['abrir']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['abrir']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['abrir']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cajas_chicas.cerrar': {
    methods: ["PATCH"]
    pattern: '/api/v1/cajas-chicas/:id/cerrar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['cerrar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['cerrar']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['cerrar']>>>
    }
  }
  'cajas_chicas.solicitar_vale': {
    methods: ["POST"]
    pattern: '/api/v1/cajas-chicas/:id/vales'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').solicitarValeCajaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').solicitarValeCajaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['solicitarVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['solicitarVale']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['solicitarVale']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'vales_caja.aprobar': {
    methods: ["PATCH"]
    pattern: '/api/v1/vales-caja/:id/aprobar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['aprobarVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['aprobarVale']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['aprobarVale']>>>
    }
  }
  'vales_caja.rechazar': {
    methods: ["PATCH"]
    pattern: '/api/v1/vales-caja/:id/rechazar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').rechazarConMotivoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').rechazarConMotivoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rechazarVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rechazarVale']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rechazarVale']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'vales_caja.desembolsar': {
    methods: ["PATCH"]
    pattern: '/api/v1/vales-caja/:id/desembolsar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['desembolsarVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['desembolsarVale']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['desembolsarVale']>>>
    }
  }
  'vales_caja.rendir': {
    methods: ["PATCH"]
    pattern: '/api/v1/vales-caja/:id/rendir'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').rendirValeCajaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').rendirValeCajaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rendirVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rendirVale']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['rendirVale']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'vales_caja.anular': {
    methods: ["POST"]
    pattern: '/api/v1/vales-caja/:id/anular'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/finanzas').anularRegistroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['anularVale']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['anularVale']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/cajas_chicas_controller').default['anularVale']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'reportes.resumen': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reportes/resumen'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['resumen']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['resumen']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['resumen']>>>
    }
  }
  'reportes.recibo_pago_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reportes/pagos/:id/recibo.pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['reciboPagoPdf']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['reciboPagoPdf']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['reciboPagoPdf']>>>
    }
  }
  'reportes.solicitud_consolidada_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reportes/solicitudes/:id/consolidado.pdf'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['solicitudConsolidadaPdf']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['solicitudConsolidadaPdf']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['solicitudConsolidadaPdf']>>>
    }
  }
  'audit_logs.listar': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/filtros').filtrosAuditLogsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['auditLogs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['auditLogs']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/reportes_controller').default['auditLogs']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
