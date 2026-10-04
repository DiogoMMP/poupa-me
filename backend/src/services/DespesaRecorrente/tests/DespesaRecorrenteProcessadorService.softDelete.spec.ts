import { jest, describe, it, expect } from '@jest/globals';
import DespesaRecorrenteProcessadorService from '../DespesaRecorrenteProcessadorService.js';

/**
 * A soft-deleted recurring rule must not generate a movimento, not even manually (B0015 / issue #89).
 */
describe('DespesaRecorrenteProcessadorService.gerarTransacaoSemValor — regra apagada', () => {
  it('refuses to generate a transação from a soft-deleted rule', async () => {
    const despesaRepo = {
      findActiveById: jest.fn().mockResolvedValue(null),
      findById: jest.fn()
    };
    const service = new DespesaRecorrenteProcessadorService(
      despesaRepo as never, {} as never, {} as never, { error: jest.fn() }
    );

    const result = await service.gerarTransacaoSemValor('DRC00000000001', {} as never, 'USR00000000001', 'User');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Despesa not found');
    expect(despesaRepo.findActiveById).toHaveBeenCalledWith('DRC00000000001');
    expect(despesaRepo.findById).not.toHaveBeenCalled();
  });
});
