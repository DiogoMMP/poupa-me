import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import BancoService from '../BancoService.js';

/**
 * Soft delete of Banco (B0016 / issue #89): a Banco with active children is refused unless cascade is requested.
 * The cascade runs in one transaction inside the repository (deleteComFilhos).
 */
describe('BancoService.deleteBanco — soft delete', () => {
  const BANCO_ID = 'BNC00000000001';
  const USER_ID = 'USR00000000001';
  const SEM_FILHOS = { contasAtivas: 0, cartoesAtivos: 0, regrasAtivas: 0 };

  let bancoRepo: Record<string, jest.Mock>;
  let logger: { error: jest.Mock };
  let service: BancoService;

  beforeEach(() => {
    bancoRepo = {
      findById: jest.fn().mockResolvedValue({ userId: { toString: () => USER_ID } }),
      contarFilhosAtivos: jest.fn().mockResolvedValue(SEM_FILHOS),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteComFilhos: jest.fn().mockResolvedValue(undefined)
    };
    logger = { error: jest.fn() };

    service = new BancoService(
      bancoRepo as never,
      {} as never,
      {} as never,
      { findByDomainId: jest.fn() } as never,
      logger
    );
  });

  it('soft-deletes a Banco that has no active children', async () => {
    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User');

    expect(result.isSuccess).toBe(true);
    expect(bancoRepo.delete).toHaveBeenCalledWith(BANCO_ID);
    expect(bancoRepo.deleteComFilhos).not.toHaveBeenCalled();
  });

  it('refuses to delete a Banco with active children and reports the counts from the repository', async () => {
    bancoRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 1, cartoesAtivos: 2, regrasAtivas: 3 });

    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User');

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual({ code: 'ACTIVE_CHILDREN', contasAtivas: 1, cartoesAtivos: 2, regrasAtivas: 3 });
    expect(bancoRepo.delete).not.toHaveBeenCalled();
    expect(bancoRepo.deleteComFilhos).not.toHaveBeenCalled();
  });

  it('with cascade, deletes the Banco and its children through the single transactional call', async () => {
    bancoRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 2, cartoesAtivos: 1, regrasAtivas: 0 });

    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User', true);

    expect(result.isSuccess).toBe(true);
    expect(bancoRepo.deleteComFilhos).toHaveBeenCalledWith(BANCO_ID);
    expect(bancoRepo.delete).not.toHaveBeenCalled();
  });

  it('reports a failure when the cascade transaction fails, without a separate delete of the Banco', async () => {
    bancoRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 1, cartoesAtivos: 0, regrasAtivas: 0 });
    bancoRepo.deleteComFilhos.mockRejectedValue(new Error('falha a meio'));

    const result = await service.deleteBanco(BANCO_ID, USER_ID, 'User', true);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Failed to delete banco');
    expect(bancoRepo.delete).not.toHaveBeenCalled();
  });

  it('keeps the authorization rule: a non-admin cannot delete another user\'s banco', async () => {
    const result = await service.deleteBanco(BANCO_ID, 'USR-OUTRO', 'User');

    expect(result.error).toBe('Unauthorized');
    expect(bancoRepo.contarFilhosAtivos).not.toHaveBeenCalled();
    expect(bancoRepo.delete).not.toHaveBeenCalled();
  });
});
