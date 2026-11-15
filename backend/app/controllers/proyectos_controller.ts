import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Proyecto from '#models/proyecto'
import { crearProyectoValidator, actualizarProyectoValidator } from '#validators/catalogo'
import { cambiarEstadoActivoValidator } from '#validators/usuario'
import { esGenerador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class ProyectosController {
  /**
   * Lista los proyectos registrados con su área, ámbito y vigencia
   */
  async listar({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const area = request.input('area')
    const ambito = request.input('ambito')
    const soloActivos = request.input('soloActivos')

    const query = Proyecto.query().orderBy('id', 'asc')
    if (area) query.where('area', String(area))
    if (ambito) query.where('ambito', String(ambito))
    if (soloActivos === 'true' || soloActivos === true) {
      query.where('esta_activo', true)
    }

    const proyectos = await query
    return response.status(200).json({ data: proyectos })
  }

  /**
   * Crea un nuevo proyecto (exclusivo para rol 'generador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(crearProyectoValidator)
    const fechaInicio = payload.fechaInicio ? DateTime.fromISO(payload.fechaInicio) : null
    const fechaFin = payload.fechaFin ? DateTime.fromISO(payload.fechaFin) : null

    if ((fechaInicio && !fechaInicio.isValid) || (fechaFin && !fechaFin.isValid)) {
      return response.status(422).json({
        codigo: 'FECHA_INVALIDA',
        mensaje: 'Las fechas de vigencia del proyecto deben tener formato ISO válido (YYYY-MM-DD).',
      })
    }

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      return response.status(422).json({
        codigo: 'VIGENCIA_INVALIDA',
        mensaje: 'La fecha de fin del proyecto no puede ser anterior a la fecha de inicio.',
      })
    }

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = new Proyecto()
      proyecto.codigo = payload.codigo
      proyecto.nombre = payload.nombre
      proyecto.descripcion = payload.descripcion ?? null
      proyecto.area = payload.area
      proyecto.ambito = payload.ambito
      proyecto.fechaInicio = fechaInicio
      proyecto.fechaFin = fechaFin
      proyecto.estaActivo = payload.estaActivo ?? true
      proyecto.useTransaction(trx)
      await proyecto.save()

      return response.status(201).json({
        mensaje: 'Proyecto creado exitosamente',
        data: proyecto,
      })
    })
  }

  /**
   * Actualiza un proyecto existente (exclusivo para rol 'generador')
   */
  async actualizar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(actualizarProyectoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = await Proyecto.query({ client: trx }).where('id', Number(params.id)).first()
      if (!proyecto) {
        return response.status(404).json({
          codigo: 'PROYECTO_NO_ENCONTRADO',
          mensaje: 'El proyecto especificado no existe.',
        })
      }

      if (payload.nombre !== undefined) proyecto.nombre = payload.nombre
      if (payload.descripcion !== undefined) proyecto.descripcion = payload.descripcion
      if (payload.area !== undefined) proyecto.area = payload.area
      if (payload.ambito !== undefined) proyecto.ambito = payload.ambito
      if (payload.fechaInicio !== undefined) {
        const nuevaInicio = payload.fechaInicio ? DateTime.fromISO(payload.fechaInicio) : null
        if (nuevaInicio && !nuevaInicio.isValid) {
          return response.status(422).json({
            codigo: 'FECHA_INVALIDA',
            mensaje: 'La fecha de inicio debe tener formato ISO válido (YYYY-MM-DD).',
          })
        }
        proyecto.fechaInicio = nuevaInicio
      }
      if (payload.fechaFin !== undefined) {
        const nuevaFin = payload.fechaFin ? DateTime.fromISO(payload.fechaFin) : null
        if (nuevaFin && !nuevaFin.isValid) {
          return response.status(422).json({
            codigo: 'FECHA_INVALIDA',
            mensaje: 'La fecha de fin debe tener formato ISO válido (YYYY-MM-DD).',
          })
        }
        proyecto.fechaFin = nuevaFin
      }
      if (payload.estaActivo !== undefined) proyecto.estaActivo = payload.estaActivo

      if (proyecto.fechaInicio && proyecto.fechaFin && proyecto.fechaFin < proyecto.fechaInicio) {
        return response.status(422).json({
          codigo: 'VIGENCIA_INVALIDA',
          mensaje: 'La fecha de fin del proyecto no puede ser anterior a la fecha de inicio.',
        })
      }

      proyecto.useTransaction(trx)
      await proyecto.save()

      return response.status(200).json({
        mensaje: 'Proyecto actualizado exitosamente',
        data: proyecto,
      })
    })
  }

  /**
   * Activa o desactiva lógicamente un proyecto (exclusivo para rol 'generador')
   */
  async cambiarEstado({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const { estaActivo } = await request.validateUsing(cambiarEstadoActivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const proyecto = await Proyecto.query({ client: trx }).where('id', Number(params.id)).first()
      if (!proyecto) {
        return response.status(404).json({
          codigo: 'PROYECTO_NO_ENCONTRADO',
          mensaje: 'El proyecto especificado no existe.',
        })
      }

      proyecto.estaActivo = estaActivo
      proyecto.useTransaction(trx)
      await proyecto.save()

      return response.status(200).json({
        mensaje: `Proyecto ${estaActivo ? 'activado' : 'desactivado'} exitosamente`,
        data: proyecto,
      })
    })
  }
}
