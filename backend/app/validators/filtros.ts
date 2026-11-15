import vine from '@vinejs/vine'

/**
 * Máximo de una columna INTEGER de PostgreSQL (todas las PK son increments()).
 * Un valor mayor llegaría a la BD como error 22003 → 500 (hallazgo M1, ADR 0015).
 */
const MAX_INTEGER_PG = 2_147_483_647

/**
 * Id usado como filtro de query: entero positivo dentro del rango de INTEGER.
 * La query llega como texto; VineJS lo convierte y rechaza 'x', '', '1.5', '0' → 422.
 */
const idFiltro = () => vine.number().withoutDecimals().min(1).max(MAX_INTEGER_PG).optional()

/**
 * Filas por página: por defecto y máximo de todos los listados (hallazgo B1, ADR 0019).
 */
export const LIMITE_POR_DEFECTO = 20
export const LIMITE_MAXIMO = 100

/**
 * Parámetros de paginación de los listados: página (≥ 1) y filas por página (1–100).
 * Un valor fuera de rango, decimal o texto responde 422; nunca se recorta en silencio.
 */
const paginacion = {
  pagina: vine.number().withoutDecimals().min(1).max(MAX_INTEGER_PG).optional(),
  limite: vine.number().withoutDecimals().min(1).max(LIMITE_MAXIMO).optional(),
}

/**
 * Filtros numéricos y paginación de los listados financieros (causaciones/deudas,
 * asignaciones, solicitudes de pago, pagos y cajas chicas). Cada controlador usa solo los
 * filtros que necesita.
 */
export const filtrosListadoValidator = vine.create({
  proyectoId: idFiltro(),
  personaId: idFiltro(),
  solicitudId: idFiltro(),
  grupoPagoId: idFiltro(),
  ...paginacion,
})

/**
 * Filtros numéricos del log de auditoría: usuario y límite de filas (1–500, por defecto 100).
 */
export const filtrosAuditLogsValidator = vine.create({
  usuarioId: idFiltro(),
  limite: vine.number().withoutDecimals().min(1).max(500).optional(),
})

/**
 * Paginación de los listados de catálogos y usuarios, que no tienen filtros numéricos.
 */
export const paginacionValidator = vine.create({ ...paginacion })
