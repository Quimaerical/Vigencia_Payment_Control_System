import type { HttpContext } from '@adonisjs/core/http'
import GrupoPago from '#models/grupo_pago'
import { crearGrupoPagoValidator, actualizarGrupoPagoValidator } from '#validators/catalogo'
import { cambiarEstadoActivoValidator } from '#validators/usuario'
import { esAdministrador } from '#abilities/main'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'
import { parametrosPaginacion, respuestaPaginada } from '#services/paginacion'
import { paginacionValidator } from '#validators/filtros'

export default class GruposPagoController {
  /**
   * Lista los grupos de pago con periodicidad y configuración de fechas de corte — paginado (máx. 100 por página)
   */
  async listar({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const { pagina, limite } = parametrosPaginacion(
      await request.validateUsing(paginacionValidator)
    )
    const soloActivos = request.input('soloActivos')

    const query = GrupoPago.query().orderBy('id', 'asc')
    if (soloActivos === 'true' || soloActivos === true) {
      query.where('esta_activo', true)
    }

    const grupos = await query.paginate(pagina, limite)
    return response.status(200).json(respuestaPaginada(grupos))
  }

  /**
   * Crea un grupo de pago (restringido a rol 'administrador')
   */
  async crear({ auth, bouncer, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const payload = await request.validateUsing(crearGrupoPagoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const grupo = new GrupoPago()
      grupo.nombre = payload.nombre
      grupo.descripcion = payload.descripcion ?? null
      grupo.periodicidad = payload.periodicidad
      grupo.diaCorte1 = payload.diaCorte1 ?? null
      grupo.diaCorte2 = payload.diaCorte2 ?? null
      grupo.configuracionCorte = payload.configuracionCorte ?? null
      grupo.estaActivo = payload.estaActivo ?? true
      grupo.useTransaction(trx)
      await grupo.save()

      return response.status(201).json({
        mensaje: 'Grupo de pago creado exitosamente',
        data: grupo,
      })
    })
  }

  /**
   * Actualiza un grupo de pago (restringido a rol 'administrador')
   */
  async actualizar({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const payload = await request.validateUsing(actualizarGrupoPagoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const grupo = await GrupoPago.query({ client: trx }).where('id', Number(params.id)).first()
      if (!grupo) {
        return response.status(404).json({
          codigo: 'GRUPO_PAGO_NO_ENCONTRADO',
          mensaje: 'El grupo de pago especificado no existe.',
        })
      }

      if (payload.nombre !== undefined) {
        const nombreExistente = await GrupoPago.query({ client: trx })
          .where('nombre', payload.nombre)
          .whereNot('id', grupo.id)
          .first()
        if (nombreExistente) {
          return response.status(422).json({
            codigo: 'NOMBRE_DUPLICADO',
            mensaje: 'Ya existe otro grupo de pago con ese nombre.',
          })
        }
        grupo.nombre = payload.nombre
      }
      if (payload.descripcion !== undefined) grupo.descripcion = payload.descripcion
      if (payload.periodicidad !== undefined) grupo.periodicidad = payload.periodicidad
      if (payload.diaCorte1 !== undefined) grupo.diaCorte1 = payload.diaCorte1
      if (payload.diaCorte2 !== undefined) grupo.diaCorte2 = payload.diaCorte2
      if (payload.configuracionCorte !== undefined) {
        grupo.configuracionCorte = payload.configuracionCorte
      }
      if (payload.estaActivo !== undefined) grupo.estaActivo = payload.estaActivo

      grupo.useTransaction(trx)
      await grupo.save()

      return response.status(200).json({
        mensaje: 'Grupo de pago actualizado exitosamente',
        data: grupo,
      })
    })
  }

  /**
   * Activa o desactiva lógicamente un grupo de pago (restringido a rol 'administrador')
   */
  async cambiarEstado({ auth, bouncer, params, request, response }: HttpContext) {
    auth.getUserOrFail()
    await bouncer.authorize(esAdministrador)

    const { estaActivo } = await request.validateUsing(cambiarEstadoActivoValidator)

    return await ejecutarTransaccionFinanciera({ auth, request }, async (trx) => {
      const grupo = await GrupoPago.query({ client: trx }).where('id', Number(params.id)).first()
      if (!grupo) {
        return response.status(404).json({
          codigo: 'GRUPO_PAGO_NO_ENCONTRADO',
          mensaje: 'El grupo de pago especificado no existe.',
        })
      }

      grupo.estaActivo = estaActivo
      grupo.useTransaction(trx)
      await grupo.save()

      return response.status(200).json({
        mensaje: `Grupo de pago ${estaActivo ? 'activado' : 'desactivado'} exitosamente`,
        data: grupo,
      })
    })
  }
}
