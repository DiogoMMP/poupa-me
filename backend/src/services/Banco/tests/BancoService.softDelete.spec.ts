import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import BancoService from '../BancoService.js';

/**
 * Soft delete of Banco (B0015 / issue #89): a Banco with active children is refused unless cascade is requested.
 */
describe('BancoService.deleteBanco — soft delete', () => {
  const BANCO_ID = 'BNC00000000001';
  const USER_ID = 'USR00000000001';

  let bancoRepo: Record<string, jest.Mock>;
  let contaRepo: Record<string, jest.Mock>;
  let cartaoRepo: Record<string, jest.Mock>;
  let despesaRepo: Record<string, jest.Mock>;
  let service: BancoService;

  const conta = (id: string) => ({ id: { toString: () => id } });

  beforeEach(() => {
    bancoRepo = {
      findById: jest.fn().mockResolvedValue({ userId: { toString: () => USER_ID } }),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    contaRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    cartaoRepo = {
      countActiveByBanco: jest.fn().mockResolvedValue(0),
      deactivateByBanco: jest.fn().mockResolvedValue(undefined),
      deactivateByContaPagamento: jest.fn().mockResolvedValue(undefined)
    };
    despesaRepo = {
      countActiveByConta: jest.fn().mockResolvedValue(0),
      deactivateByConta: jest.fn().mockResolvedValue(undefined)
    };

    service = new BancoService(
      bancoRepo as never,
      contaRepo as never,
      cartaoRepo as never,
      { findByDomainId: jest.fn() } as never,
      despesaRepo as never,
      { error: jest.fn() }
    );
  });

  it('soft-deletes a Banco that has no active children', async () => {
    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User');

    expect(result.isSuccess).toBe(true);
    expect(bancoRepo.delete).toHaveBeenCalledWith(BANCO_ID);
  });

  it('refuses to delete a Banco with active contas and reports the counts', async () => {
    contaRepo.findAll.mockResolvedValue([conta('CNT1')]);
    cartaoRepo.countActiveByBanco.mockResolvedValue(2);
    despesaRepo.countActiveByConta.mockResolvedValue(3);

    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User');

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual({ code: 'ACTIVE_CHILDREN', contasAtivas: 1, cartoesAtivos: 2, regrasAtivas: 3 });
    expect(bancoRepo.delete).not.toHaveBeenCalled();
    expect(contaRepo.delete).not.toHaveBeenCalled();
    expect(cartaoRepo.deactivateByBanco).not.toHaveBeenCalled();
  });

  it('with cascade, soft-deletes the contas (and their cartões and rules), the banco cartões, then the banco', async () => {
    contaRepo.findAll.mockResolvedValue([conta('CNT1'), conta('CNT2')]);
    cartaoRepo.countActiveByBanco.mockResolvedValue(1);

    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User', true);

    expect(result.isSuccess).toBe(true);
    expect(cartaoRepo.deactivateByContaPagamento).toHaveBeenCalledWith('CNT1');
    expect(cartaoRepo.deactivateByContaPagamento).toHaveBeenCalledWith('CNT2');
    expect(despesaRepo.deactivateByConta).toHaveBeenCalledWith('CNT1');
    expect(despesaRepo.deactivateByConta).toHaveBeenCalledWith('CNT2');
    expect(contaRepo.delete).toHaveBeenCalledWith('CNT1');
    expect(contaRepo.delete).toHaveBeenCalledWith('CNT2');
    expect(cartaoRepo.deactivateByBanco).toHaveBeenCalledWith(BANCO_ID);
    expect(bancoRepo.delete).toHaveBeenCalledWith(BANCO_ID);
  });

  it('keeps the authorization rule: a non-admin cannot delete another user\'s banco', async () => {
    const result = await service.deleteBanco(BANCO_ID, 'USR-OUTRO', 'User');

    expect(result.error).toBe('Unauthorized');
    expect(bancoRepo.delete).not.toHaveBeenCalled();
  });
});
