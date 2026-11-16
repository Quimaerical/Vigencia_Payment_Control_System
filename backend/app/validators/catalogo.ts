import vine from '@vinejs/vine'
import { AreaProyecto, AmbitoProyecto, PeriodicidadGrupoPago } from '@app/shared'
import { idEnteroPositivo, montoPositivo } from '#validators/filtros'

const isoDateString = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * Validadores para Personas (Beneficiarios sin usuario en el sistema)
 */
export const crearPersonaValidator = vine.create({
  identificacion: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(50)
    .unique({ table: 'personas', column: 'identificacion' }),
  nombres: vine.string().trim().minLength(2).maxLength(100),
  apellidos: vine.string().trim().minLength(2).maxLength(100),
  correo: vine
    .string()
    .trim()
    .email()
    .maxLength(255)
    .unique({ table: 'personas', column: 'correo' })
    .nullable()
    .optional(),
  estaActivo: vine.boolean().optional(),
})

export const actualizarPersonaValidator = vine.create({
  nombres: vine.string().trim().minLength(2).maxLength(100).optional(),
  apellidos: vine.string().trim().minLength(2).maxLength(100).optional(),
  correo: vine.string().trim().email().maxLength(255).nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

/**
 * Validadores para Proyectos (Área, Ámbito y Vigencia)
 */
export const crearProyectoValidator = vine.create({
  codigo: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .unique({ table: 'proyectos', column: 'codigo' }),
  nombre: vine.string().trim().minLength(3).maxLength(150),
  descripcion: vine.string().trim().maxLength(1000).nullable().optional(),
  area: vine.enum(Object.values(AreaProyecto)),
  ambito: vine.enum(Object.values(AmbitoProyecto)),
  fechaInicio: isoDateString().nullable().optional(),
  fechaFin: isoDateString().nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

export const actualizarProyectoValidator = vine.create({
  nombre: vine.string().trim().minLength(3).maxLength(150).optional(),
  descripcion: vine.string().trim().maxLength(1000).nullable().optional(),
  area: vine.enum(Object.values(AreaProyecto)).optional(),
  ambito: vine.enum(Object.values(AmbitoProyecto)).optional(),
  fechaInicio: isoDateString().nullable().optional(),
  fechaFin: isoDateString().nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

/**
 * Validadores para Grupos de Pago (Periodicidad y Fechas de Corte)
 */
export const crearGrupoPagoValidator = vine.create({
  nombre: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(100)
    .unique({ table: 'grupos_pagos', column: 'nombre' }),
  descripcion: vine.string().trim().maxLength(500).nullable().optional(),
  periodicidad: vine.enum(Object.values(PeriodicidadGrupoPago)),
  diaCorte1: vine.number().withoutDecimals().min(1).max(31).nullable().optional(),
  diaCorte2: vine.number().withoutDecimals().min(1).max(31).nullable().optional(),
  configuracionCorte: vine.record(vine.any()).nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

export const actualizarGrupoPagoValidator = vine.create({
  nombre: vine.string().trim().minLength(2).maxLength(100).optional(),
  descripcion: vine.string().trim().maxLength(500).nullable().optional(),
  periodicidad: vine.enum(Object.values(PeriodicidadGrupoPago)).optional(),
  diaCorte1: vine.number().withoutDecimals().min(1).max(31).nullable().optional(),
  diaCorte2: vine.number().withoutDecimals().min(1).max(31).nullable().optional(),
  configuracionCorte: vine.record(vine.any()).nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

/**
 * Validadores para Asignaciones (Persona + Proyecto + Grupo de Pago + Monto por Período)
 */
export const crearAsignacionValidator = vine.create({
  personaId: idEnteroPositivo(),
  proyectoId: idEnteroPositivo(),
  grupoPagoId: idEnteroPositivo(),
  montoPeriodo: montoPositivo(),
  fechaInicio: isoDateString(),
  fechaFin: isoDateString().nullable().optional(),
  estaActivo: vine.boolean().optional(),
})

export const actualizarAsignacionValidator = vine.create({
  montoPeriodo: montoPositivo().optional(),
  fechaInicio: isoDateString().optional(),
  fechaFin: isoDateString().nullable().optional(),
  estaActivo: vine.boolean().optional(),
})
