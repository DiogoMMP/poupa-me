import { jest, describe, it, expect } from '@jest/globals';
import TransacaoService from '../TransacaoService.js';

/**
 * A new movimento must not target a soft-deleted conta or categoria (B0015 / issue #89). The creation path resolves
 * its targets with findActiveById, so a deleted one is treated as not found.
 */
describe('TransacaoService.createEntrada — alvos apagados', () => {
  const inputDTO = {
    descricao: 'Salário',
    data: { dia: 15, mes: 1, ano: 2024 },
    valor: { valor: 100, moeda: 'EUR' },
    categoriaId: 'CAT00000000001',
    contaId: 'CNT00000000001'
  } as never;

  it('rejects a new movimento on a soft-deleted conta', async () => {
    const categoriaRepo = { findActiveById: jest.fn().mockResolvedValue({}), findById: jest.fn() };
    const contaRepo = { findActiveById: jest.fn().mockResolvedValue(null), findById: jest.fn() };
    const service = new TransacaoService(
      {} as never, categoriaRepo as never, contaRepo as never, {} as never, {} as never, {} as never, { error: jest.fn() }
    );

    const result = await service.createEntrada(inputDTO);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Target Account not found');
    expect(contaRepo.findActiveById).toHaveBeenCalledWith('CNT00000000001');
    expect(contaRepo.findById).not.toHaveBeenCalled();
  });

  it('rejects a new movimento on a soft-deleted categoria', async () => {
    const categoriaRepo = { findActiveById: jest.fn().mockResolvedValue(null), findById: jest.fn() };
    const contaRepo = { findActiveById: jest.fn(), findById: jest.fn() };
    const service = new TransacaoService(
      {} as never, categoriaRepo as never, contaRepo as never, {} as never, {} as never, {} as never, { error: jest.fn() }
    );

    const result = await service.createEntrada(inputDTO);

    expect(result.error).toBe('Target Category not found');
    expect(contaRepo.findActiveById).not.toHaveBeenCalled();
  });
});
