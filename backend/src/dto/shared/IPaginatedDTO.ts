/**
 * Pagination parameters received from the client (`?page=&pageSize=`).
 * `page` is 1-based.
 */
export interface IPaginationParams {
    page: number;
    pageSize: number;
}

/**
 * Paginated response returned by list endpoints.
 */
export interface IPaginatedDTO<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}

/**
 * One page of rows read by a repository, plus the total count matching the same filters.
 */
export interface IPagedRows<T> {
    items: T[];
    total: number;
}
