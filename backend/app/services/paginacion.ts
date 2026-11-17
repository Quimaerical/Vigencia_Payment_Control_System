import type { LucidRow, ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { LIMITE_POR_DEFECTO } from '#validators/filtros'

/**
 * Cuerpo de respuesta de un listado paginado (ADR 0019).
 */
export interface RespuestaPaginada<T> {
  data: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

/**
 * Página y límite ya validados por VineJS, con los valores por defecto aplicados.
 */
export function parametrosPaginacion(filtros: { pagina?: number; limite?: number }) {
  return {
    pagina: filtros.pagina ?? 1,
    limite: filtros.limite ?? LIMITE_POR_DEFECTO,
  }
}

/**
 * Arma { data, total, pagina, limite, totalPaginas } desde el paginador de Lucid.
 * totalPaginas es 0 cuando no hay filas (Lucid informa lastPage = 1).
 */
export function respuestaPaginada<T extends LucidRow>(
  paginador: ModelPaginatorContract<T>
): RespuestaPaginada<T> {
  return {
    data: paginador.all(),
    total: paginador.total,
    pagina: paginador.currentPage,
    limite: paginador.perPage,
    totalPaginas: Math.ceil(paginador.total / paginador.perPage),
  }
}
