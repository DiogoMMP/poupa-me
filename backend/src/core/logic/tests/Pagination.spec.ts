import { describe, it, expect } from '@jest/globals';
import { parsePagination, toPaginated } from '../Pagination.js';

describe('parsePagination', () => {
    it('defaults to page 1 and pageSize 25 when nothing is sent', () => {
        const result = parsePagination({});
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ page: 1, pageSize: 25 });
    });

    it.each([10, 25, 50, 100])('parses pageSize %i from query strings', (pageSize) => {
        const result = parsePagination({ page: '3', pageSize: String(pageSize) });
        expect(result.getValue()).toEqual({ page: 3, pageSize });
    });

    it.each(['0', '-1', '1.5', 'abc', '1e308', '1e20'])('rejects page = %s', (page) => {
        expect(parsePagination({ page }).isFailure).toBe(true);
    });

    it('rejects a safe-integer page whose OFFSET would not be a safe integer', () => {
        // 4e14 is a safe integer, but (4e14 - 1) * 25 exceeds Number.MAX_SAFE_INTEGER
        expect(parsePagination({ page: '400000000000000', pageSize: '25' }).isFailure).toBe(true);
    });

    it.each(['5', '20', '1000', 'abc'])('rejects pageSize = %s (not in 10/25/50/100)', (pageSize) => {
        expect(parsePagination({ pageSize }).isFailure).toBe(true);
    });
});

describe('toPaginated', () => {
    it('computes totalPages rounding up', () => {
        const res = toPaginated(['a', 'b'], 87, { page: 4, pageSize: 25 });
        expect(res).toEqual({ items: ['a', 'b'], page: 4, pageSize: 25, totalPages: 4, totalItems: 87 });
    });

    it('returns totalPages 0 when there are no items', () => {
        const res = toPaginated([], 0, { page: 1, pageSize: 10 });
        expect(res.totalPages).toBe(0);
        expect(res.totalItems).toBe(0);
    });
});
