import { Result } from './Result.js';
import type { IPaginatedDTO, IPaginationParams } from '../../dto/shared/IPaginatedDTO.js';

/** Page sizes accepted by paginated endpoints. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Page size used when the client does not send `pageSize`. */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Parses and validates `page` and `pageSize` from a request query.
 * Missing values fall back to `page = 1` and `pageSize = DEFAULT_PAGE_SIZE`.
 */
export function parsePagination(query: Record<string, unknown>): Result<IPaginationParams> {
    const rawPage = query.page;
    const rawPageSize = query.pageSize;

    const page = rawPage === undefined || rawPage === '' ? 1 : Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
        return Result.fail<IPaginationParams>('page must be an integer greater than or equal to 1');
    }

    const pageSize = rawPageSize === undefined || rawPageSize === '' ? DEFAULT_PAGE_SIZE : Number(rawPageSize);
    if (!(PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)) {
        return Result.fail<IPaginationParams>(`pageSize must be one of: ${PAGE_SIZE_OPTIONS.join(', ')}`);
    }

    return Result.ok<IPaginationParams>({ page, pageSize });
}

/**
 * Builds a paginated response from one page of items and the total item count.
 */
export function toPaginated<T>(items: T[], totalItems: number, params: IPaginationParams): IPaginatedDTO<T> {
    return {
        items,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(totalItems / params.pageSize),
        totalItems,
    };
}
