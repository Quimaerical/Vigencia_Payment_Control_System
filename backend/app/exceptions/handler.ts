import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as bouncerErrors } from '@adonisjs/bouncer'
import AuditLog from '#models/audit_log'
import { ejecutarTransaccionFinanciera } from '#services/transaccion_financiera'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * Reporta los errores al log. Las denegaciones de Bouncer (403) se registran aparte, con
   * usuario, rol, ruta e IP, en el log y en `audit_logs` (ADR 0016); el resto sigue el
   * reporte por defecto.
   *
   * @note No se envía ninguna respuesta desde este método.
   */
  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
      await this.registrarDenegacion(error, ctx)
      return
    }
    return super.report(error, ctx)
  }

  /**
   * Deja rastro forense de una denegación de autorización: una línea `warn` estructurada y
   * una fila inmutable `ACCESO_DENEGADO` en `audit_logs`, en su propia transacción para que
   * no se revierta con la petición. Nunca guarda el cuerpo, la query ni cabeceras. Si la
   * escritura falla, lo registra como `error` y no altera el 403 que recibe el cliente.
   */
  private async registrarDenegacion(
    error: InstanceType<typeof bouncerErrors.E_AUTHORIZATION_FAILURE>,
    ctx: HttpContext
  ) {
    const usuario = ctx.auth?.user
    const idRuta = Number(ctx.params?.id)
    const registroId = Number.isSafeInteger(idRuta) && idRuta > 0 ? idRuta : 0
    const detalle = {
      metodo: ctx.request.method(),
      ruta: ctx.route?.pattern ?? null,
      rol: usuario?.rol ?? null,
      // `error.message` siempre es "Access denied"; el motivo real de la ability está en `response`.
      motivo: error.response?.message ?? error.message,
    }

    ctx.logger.warn(
      {
        evento: 'acceso_denegado',
        usuarioId: usuario?.id ?? null,
        registroId,
        ip: ctx.request.ip(),
        ...detalle,
        ...this.context(ctx),
      },
      'Acceso denegado por autorización'
    )

    try {
      await ejecutarTransaccionFinanciera(ctx, async (trx) => {
        const registro = new AuditLog()
        registro.accion = 'ACCESO_DENEGADO'
        registro.tablaAfectada = 'autorizacion'
        registro.registroId = registroId
        registro.usuarioId = usuario?.id ?? null
        registro.direccionIp = ctx.request.ip()
        registro.datosAnteriores = null
        registro.datosNuevos = detalle
        registro.useTransaction(trx)
        await registro.save()
      })
    } catch (errorAuditoria) {
      ctx.logger.error(
        { err: errorAuditoria, evento: 'acceso_denegado_sin_auditar', ...this.context(ctx) },
        'No se pudo registrar la denegación en audit_logs'
      )
    }
  }
}
