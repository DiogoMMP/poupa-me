import { describe, it, expect } from '@jest/globals';
import { parsePagination, toPaginated } from '../Pagination.js';

describe('parsePagination', () => {
    it('defaults to page 1 and pageSize 25 when nothing is sent', () => {
        const result = parsePagination({});
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ page: 1, pageSize: 25 });
    });

    it('parses valid page and pageSize from query strings', () => {
        const result = parsePagination({ page: '3', pageSize: '25' });
        expect(result.getValue()).toEqual({ page: 3, pageSize: 25 });
    });

    it.each(['0', '-1', '1.5', 'abc'])('rejects page = %s', (page) => {
        expect(parsePagination({ page }).isFailure).toBe(true);
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
