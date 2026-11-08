/**
 * Resposta paginada devolvida pela API (`?page=&pageSize=`). `page` é 1-based.
 */
export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}
