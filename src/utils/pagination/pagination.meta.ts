import { PaginationQueryParamsDto } from './pagination.dto';

interface PaginationMetaProps {
  /** Configuración de paginación solicitada (página actual y límite por página) */
  queryParams: PaginationQueryParamsDto;
  /** Cantidad total de registros existentes en la base de datos */
  totalCount: number;
  /** Cantidad de registros devueltos en la consulta/página actual */
  currentCount: number;
}

/**
 * Genera la estructura de metadatos para respuestas paginadas.
 *
 * @param params Objeto con los parámetros de consulta y los conteos de registros.
 * @returns Objeto con la información calculada de la paginación (página actual, total de ítems, total de páginas, etc.).
 */
export const PaginationMeta = ({
  queryParams,
  totalCount,
  currentCount,
}: PaginationMetaProps) => {
  return {
    page: queryParams.page,
    page_items: currentCount,
    limit: queryParams.limit,
    total_items: totalCount,
    total_pages: Math.ceil(totalCount / queryParams.limit),
  };
};