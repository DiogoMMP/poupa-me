import { HttpErrorResponse } from '@angular/common/http';
import { mapTransacaoErrorMessage } from './transacao-error.util';

describe('mapTransacaoErrorMessage', () => {
  it('should map the future-date backend message to a PT-PT message', () => {
    const err = new HttpErrorResponse({ error: { error: 'Invalid date or date is in the future' }, status: 400 });
    expect(mapTransacaoErrorMessage(err, 'Falha ao criar entrada')).toBe('A data não pode ser uma data futura.');
  });

  it('should fall back to the given message for an unknown backend message', () => {
    const err = new HttpErrorResponse({ error: { error: 'Some other backend error' }, status: 400 });
    expect(mapTransacaoErrorMessage(err, 'Falha ao criar entrada')).toBe('Falha ao criar entrada');
  });

  it('should fall back to the given message when the error has no HttpErrorResponse body', () => {
    expect(mapTransacaoErrorMessage(new Error('network error'), 'Falha ao criar entrada')).toBe('Falha ao criar entrada');
    expect(mapTransacaoErrorMessage(undefined, 'Falha ao criar entrada')).toBe('Falha ao criar entrada');
  });
});
