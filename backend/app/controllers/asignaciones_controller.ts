import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Asignacion from '#models/asignacion'
import Persona from '#models/persona'
import Proyecto from '#models/proyecto'
import GrupoPago from '#models/grupo_pago'
import { crearAsignacionValidator, actualizarAsignacionValidator } from '#validators/catalogo'
import { cambiarEstadoActivoValidator } from '#validators/usuario'
import { esGenerador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class AsignacionesController {
  /**
   * Lista las asignaciones (cruce persona + proyecto + grupo_pago)
   */
  async listar({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const proyectoId = request.input('proyectoId')
    const personaId = request.input('personaId')
    const grupoPagoId = request.input('grupoPagoId')
    const soloActivos = request.input('soloActivos')

    const query = Asignacion.query()
      .preload('persona')
      .preload('proyecto')
      .preload('grupoPago')
      .orderBy('id', 'asc')

    if (proyectoId) query.where('proyecto_id', Number(proyectoId))
    if (personaId) query.where('persona_id', Number(personaId))
    if (grupoPagoId) query.where('grupo_pago_id', Number(grupoPagoId))
    if (soloActivos === 'true' || soloActivos === true) {
      query.where('esta_activo', true)
    }

    const asignaciones = await query
    return response.status(200).json({ data: asignaciones })
  }

  /**
   * Crea una asignación vinculando Persona, Proyecto y Grupo de Pago (rol 'generador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    const usuario = auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(crearAsignacionValidator)
    const fechaInicio = DateTime.fromISO(payload.fechaInicio)
    const fechaFin = payload.fechaFin ? DateTime.fromISO(payload.fechaFin) : null

    if (!fechaInicio.isValid || (fechaFin && !fechaFin.isValid)) {
      return response.status(422).json({
        codigo: 'FECHA_INVALIDA',
        mensaje: 'Las fechas de la asignación deben tener formato ISO válido (YYYY-MM-DD).',
      })
    }

    if (fechaFin && fechaFin < fechaInicio) {
      return response.status(422).json({
        codigo: 'VIGENCIA_INVALIDA',
        mensaje: 'La fecha de fin de la asignación no puede ser anterior a la fecha de inicio.',
      })
    }

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const persona = await Persona.query({ client: trx }).where('id', payload.personaId).first()
      const proyecto = await Proyecto.query({ client: trx }).where('id', payload.proyectoId).first()
      const grupoPago = await GrupoPago.query({ client: trx })
        .where('id', payload.grupoPagoId)
        .first()

      if (!persona || !persona.estaActivo) {
        return response.status(422).json({
          codigo: 'PERSONA_INVALIDA',
          mensaje: 'El beneficiario no existe o se encuentra inactivo.',
        })
      }
      if (!proyecto || !proyecto.estaActivo) {
        return response.status(422).json({
          codigo: 'PROYECTO_INVALIDO',
          mensaje: 'El proyecto no existe o se encuentra inactivo.',
        })
      }
      if (!grupoPago || !grupoPago.estaActivo) {
        return response.status(422).json({
          codigo: 'GRUPO_PAGO_INVALIDO',
          mensaje: 'El grupo de pago no existe o se encuentra inactivo.',
        })
      }

      const asignacion = new Asignacion()
      asignacion.personaId = payload.personaId
      asignacion.proyectoId = payload.proyectoId
      asignacion.grupoPagoId = payload.grupoPagoId
      asignacion.creadoPorId = usuario.id
      asignacion.montoPeriodo = Number(payload.montoPeriodo.toFixed(2))
      asignacion.fechaInicio = fechaInicio
      asignacion.fechaFin = fechaFin
      asignacion.estaActivo = payload.estaActivo ?? true
      asignacion.useTransaction(trx)
      await asignacion.save()

      return response.status(201).json({
        mensaje: 'Asignación creada exitosamente',
        data: asignacion,
      })
    })
  }

  /**
   * Actualiza monto o fechas de una asignación (rol 'generador')
   */
  async actualizar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(actualizarAsignacionValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const asignacion = await Asignacion.query({ client: trx })
        .where('id', Number(params.id))
        .first()

      if (!asignacion) {
        return response.status(404).json({
          codigo: 'ASIGNACION_NO_ENCONTRADA',
          mensaje: 'La asignación especificada no existe.',
        })
      }

      if (payload.montoPeriodo !== undefined) {
        asignacion.montoPeriodo = Number(payload.montoPeriodo.toFixed(2))
      }
      if (payload.fechaInicio !== undefined) {
        asignacion.fechaInicio = DateTime.fromISO(payload.fechaInicio)
      }
      if (payload.fechaFin !== undefined) {
        asignacion.fechaFin = payload.fechaFin ? DateTime.fromISO(payload.fechaFin) : null
      }
      if (payload.estaActivo !== undefined) {
        asignacion.estaActivo = payload.estaActivo
      }

      if (asignacion.fechaFin && asignacion.fechaFin < asignacion.fechaInicio) {
        return response.status(422).json({
          codigo: 'VIGENCIA_INVALIDA',
          mensaje: 'La fecha de fin de la asignación no puede ser anterior a la fecha de inicio.',
        })
      }

      asignacion.useTransaction(trx)
      await asignacion.save()

      return response.status(200).json({
        mensaje: 'Asignación actualizada exitosamente',
        data: asignacion,
      })
    })
  }

  /**
   * Activa o desactiva lógicamente una asignación (rol 'generador')
   */
  async cambiarEstado({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const { estaActivo } = await request.validateUsing(cambiarEstadoActivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const asignacion = await Asignacion.query({ client: trx })
        .where('id', Number(params.id))
        .first()

      if (!asignacion) {
        return response.status(404).json({
          codigo: 'ASIGNACION_NO_ENCONTRADA',
          mensaje: 'La asignación especificada no existe.',
        })
      }

      asignacion.estaActivo = estaActivo
      asignacion.useTransaction(trx)
      await asignacion.save()

      return response.status(200).json({
        mensaje: `Asignación ${estaActivo ? 'activada' : 'desactivada'} exitosamente`,
        data: asignacion,
      })
    })
  }
}
