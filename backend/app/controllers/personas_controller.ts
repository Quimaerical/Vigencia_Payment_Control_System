import type { HttpContext } from '@adonisjs/core/http'
import Persona from '#models/persona'
import { crearPersonaValidator, actualizarPersonaValidator } from '#validators/catalogo'
import { cambiarEstadoActivoValidator } from '#validators/usuario'
import { esGenerador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'
import { parametrosPaginacion, respuestaPaginada } from '#services/paginacion'
import { paginacionValidator } from '#validators/filtros'

export default class PersonasController {
  /**
   * Lista los beneficiarios registrados (los beneficiarios no tienen usuario en el sistema) — paginado (máx. 100 por página)
   */
  async listar({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const { pagina, limite } = parametrosPaginacion(
      await request.validateUsing(paginacionValidator)
    )
    const soloActivos = request.input('soloActivos')
    const query = Persona.query().orderBy('id', 'asc')

    if (soloActivos === 'true' || soloActivos === true) {
      query.where('esta_activo', true)
    }

    const personas = await query.paginate(pagina, limite)
    return response.status(200).json(respuestaPaginada(personas))
  }

  /**
   * Registra una nueva persona/beneficiario (exclusivo para rol 'generador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(crearPersonaValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const persona = new Persona()
      persona.identificacion = payload.identificacion
      persona.nombres = payload.nombres
      persona.apellidos = payload.apellidos
      persona.correo = payload.correo ?? null
      persona.estaActivo = payload.estaActivo ?? true
      persona.useTransaction(trx)
      await persona.save()

      return response.status(201).json({
        mensaje: 'Beneficiario registrado exitosamente',
        data: persona,
      })
    })
  }

  /**
   * Actualiza los datos de un beneficiario (exclusivo para rol 'generador')
   */
  async actualizar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const payload = await request.validateUsing(actualizarPersonaValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const persona = await Persona.query({ client: trx }).where('id', Number(params.id)).first()
      if (!persona) {
        return response.status(404).json({
          codigo: 'PERSONA_NO_ENCONTRADA',
          mensaje: 'El beneficiario especificado no existe.',
        })
      }

      if (payload.nombres !== undefined) persona.nombres = payload.nombres
      if (payload.apellidos !== undefined) persona.apellidos = payload.apellidos
      if (payload.correo !== undefined) {
        if (payload.correo) {
          const correoExistente = await Persona.query({ client: trx })
            .where('correo', payload.correo)
            .whereNot('id', persona.id)
            .first()
          if (correoExistente) {
            return response.status(422).json({
              codigo: 'CORREO_DUPLICADO',
              mensaje: 'Ya existe otro beneficiario registrado con ese correo electrónico.',
            })
          }
        }
        persona.correo = payload.correo
      }
      if (payload.estaActivo !== undefined) persona.estaActivo = payload.estaActivo

      persona.useTransaction(trx)
      await persona.save()

      return response.status(200).json({
        mensaje: 'Beneficiario actualizado exitosamente',
        data: persona,
      })
    })
  }

  /**
   * Activa o desactiva lógicamente a un beneficiario (exclusivo para rol 'generador')
   */
  async cambiarEstado({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esGenerador)

    const { estaActivo } = await request.validateUsing(cambiarEstadoActivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const persona = await Persona.query({ client: trx }).where('id', Number(params.id)).first()
      if (!persona) {
        return response.status(404).json({
          codigo: 'PERSONA_NO_ENCONTRADA',
          mensaje: 'El beneficiario especificado no existe.',
        })
      }

      persona.estaActivo = estaActivo
      persona.useTransaction(trx)
      await persona.save()

      return response.status(200).json({
        mensaje: `Beneficiario ${estaActivo ? 'activado' : 'desactivado'} exitosamente`,
        data: persona,
      })
    })
  }
}
