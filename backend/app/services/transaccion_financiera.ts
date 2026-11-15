import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export interface OpcionesContextoFinanciero {
  userId?: number | null
  ip?: string | null
}

/**
 * Configura las variables de sesión locales de PostgreSQL (`is_local = true`)
 * dentro de una transacción activa para garantizar que los triggers de
 * Segregación de Funciones (RBAC) y Auditoría Forense identifiquen siempre
 * al actor autenticado y su dirección IP. La auditoría automática no admite
 * omisión (ADR 0007).
 */
export async function configurarContextoAuditoriaTrx(
  trx: TransactionClientContract,
  opciones: OpcionesContextoFinanciero
): Promise<void> {
  if (trx.dialect.name !== 'postgres') {
    return
  }

  const userIdStr = opciones.userId ? String(opciones.userId) : ''
  const ipStr = opciones.ip ?? ''

  await trx.rawQuery(`SELECT set_config('app.current_user_id', ?, true)`, [userIdStr])
  await trx.rawQuery(`SELECT set_config('app.current_ip', ?, true)`, [ipStr])
}

/**
 * Helper transaccional centralizado para todas las rutas y servicios financieros
 * (pagos, causaciones, solicitudes, asignaciones, cajas chicas y vales).
 * Establece automáticamente el contexto de sesión PostgreSQL (`app.current_user_id`
 * y `app.current_ip`) antes de ejecutar la lógica de negocio. La auditoría de dominio,
 * si existe, se escribe además de la automática, nunca en su lugar (ADR 0014).
 */
export async function ejecutarTransaccionFinanciera<T>(
  ctx: Pick<HttpContext, 'auth' | 'request'>,
  callback: (trx: TransactionClientContract) => Promise<T>
): Promise<T> {
  const usuario = ctx.auth.user
  const ip = ctx.request.ip()

  return await db.transaction(async (trx) => {
    await configurarContextoAuditoriaTrx(trx, {
      userId: usuario?.id ?? null,
      ip,
    })

    return await callback(trx)
  })
}
