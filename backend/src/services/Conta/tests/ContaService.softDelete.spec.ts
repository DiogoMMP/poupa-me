import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import ContaService from '../ContaService.js';

/**
 * Soft delete of Conta (B0015 / issue #89): a Conta with cartões paid from it or active recurring rules is refused
 * unless cascade is requested.
 */
describe('ContaService.deleteConta — soft delete', () => {
  const CONTA_ID = 'CNT00000000001';

  let contaRepo: Record<string, jest.Mock>;
  let cartaoRepo: Record<string, jest.Mock>;
  let despesaRepo: Record<string, jest.Mock>;
  let service: ContaService;

  beforeEach(() => {
    contaRepo = { delete: jest.fn().mockResolvedValue(undefined) };
    cartaoRepo = {
      countActiveByContaPagamento: jest.fn().mockResolvedValue(0),
      deactivateByContaPagamento: jest.fn().mockResolvedValue(undefined)
    };
    despesaRepo = {
      countActiveByConta: jest.fn().mockResolvedValue(0),
      deactivateByConta: jest.fn().mockResolvedValue(undefined)
    };

    service = new ContaService(
      contaRepo as never,
      {} as never,
      {} as never,
      cartaoRepo as never,
      despesaRepo as never,
      { error: jest.fn() }
    );
  });

  it('soft-deletes a Conta that has no active dependants', async () => {
    const result = await service.deleteConta(CONTA_ID);

    expect(result.isSuccess).toBe(true);
    expect(contaRepo.delete).toHaveBeenCalledWith(CONTA_ID);
  });

  it('refuses to delete a Conta that still has cartões or rules, and reports the counts', async () => {
    cartaoRepo.countActiveByContaPagamento.mockResolvedValue(1);
    despesaRepo.countActiveByConta.mockResolvedValue(4);

    const result = await service.deleteConta(CONTA_ID);

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual({ code: 'ACTIVE_CHILDREN', contasAtivas: 0, cartoesAtivos: 1, regrasAtivas: 4 });
    expect(contaRepo.delete).not.toHaveBeenCalled();
    expect(cartaoRepo.deactivateByContaPagamento).not.toHaveBeenCalled();
    expect(despesaRepo.deactivateByConta).not.toHaveBeenCalled();
  });

  it('with cascade, soft-deletes the cartões paid from it and the rules that reference it, then the conta', async () => {
    cartaoRepo.countActiveByContaPagamento.mockResolvedValue(1);
    despesaRepo.countActiveByConta.mockResolvedValue(2);

    const result = await service.deleteConta(CONTA_ID, true);

    expect(result.isSuccess).toBe(true);
    expect(cartaoRepo.deactivateByContaPagamento).toHaveBeenCalledWith(CONTA_ID);
    expect(despesaRepo.deactivateByConta).toHaveBeenCalledWith(CONTA_ID);
    expect(contaRepo.delete).toHaveBeenCalledWith(CONTA_ID);
  });
});
