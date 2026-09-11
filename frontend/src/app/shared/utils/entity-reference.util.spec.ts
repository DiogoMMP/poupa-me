import { formatEntityReference } from './entity-reference.util';

describe('formatEntityReference', () => {
  it('should format as "nome (id)" when a nome is present', () => {
    expect(formatEntityReference({ id: 'USR00000000001', nome: 'Diogo Silva' })).toBe('Diogo Silva (USR00000000001)');
  });

  it('should fall back to just the id when nome is missing', () => {
    expect(formatEntityReference({ id: 'USR00000000001' })).toBe('USR00000000001');
  });

  it('should return "-" when the reference itself is undefined', () => {
    expect(formatEntityReference(undefined)).toBe('-');
  });
});
