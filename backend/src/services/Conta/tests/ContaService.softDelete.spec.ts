import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import ContaService from '../ContaService.js';

/**
 * Soft delete of Conta (B0015 / issue #89): a Conta with cartões paid from it or active recurring rules is refused
 * unless cascade is requested. The cascade runs in one transaction inside the repository (deleteComFilhos).
 * A Conta can only be linked to an active Banco.
 */
describe('ContaService — soft delete', () => {
  const CONTA_ID = 'CNT00000000001';
  const USER_ID = 'USR00000000001';

  let contaRepo: Record<string, jest.Mock>;
  let bancoRepo: Record<string, jest.Mock>;
  let service: ContaService;

  beforeEach(() => {
    contaRepo = {
      contarFilhosAtivos: jest.fn().mockResolvedValue({ contasAtivas: 0, cartoesAtivos: 0, regrasAtivas: 0 }),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteComFilhos: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn()
    };
    bancoRepo = { findActiveById: jest.fn().mockResolvedValue(null), findAll: jest.fn().mockResolvedValue([]) };

    service = new ContaService(
      contaRepo as never,
      bancoRepo as never,
      { findByDomainId: jest.fn() } as never,
      { error: jest.fn() }
    );
  });

  describe('deleteConta', () => {
    it('soft-deletes a Conta that has no active dependants', async () => {
      const result = await service.deleteConta(CONTA_ID);

      expect(result.isSuccess).toBe(true);
      expect(contaRepo.delete).toHaveBeenCalledWith(CONTA_ID);
      expect(contaRepo.deleteComFilhos).not.toHaveBeenCalled();
    });

    it('refuses to delete a Conta that still has cartões or rules, and reports the counts', async () => {
      contaRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 0, cartoesAtivos: 1, regrasAtivas: 4 });

      const result = await service.deleteConta(CONTA_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toEqual({ code: 'ACTIVE_CHILDREN', contasAtivas: 0, cartoesAtivos: 1, regrasAtivas: 4 });
      expect(contaRepo.delete).not.toHaveBeenCalled();
      expect(contaRepo.deleteComFilhos).not.toHaveBeenCalled();
    });

    it('with cascade, deletes the Conta and its dependants through the single transactional call', async () => {
      contaRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 0, cartoesAtivos: 1, regrasAtivas: 2 });

      const result = await service.deleteConta(CONTA_ID, true);

      expect(result.isSuccess).toBe(true);
      expect(contaRepo.deleteComFilhos).toHaveBeenCalledWith(CONTA_ID);
      expect(contaRepo.delete).not.toHaveBeenCalled();
    });

    it('reports a failure when the cascade transaction fails', async () => {
      contaRepo.contarFilhosAtivos.mockResolvedValue({ contasAtivas: 0, cartoesAtivos: 1, regrasAtivas: 0 });
      contaRepo.deleteComFilhos.mockRejectedValue(new Error('falha a meio'));

      const result = await service.deleteConta(CONTA_ID, true);

      expect(result.isFailure).toBe(true);
      expect(contaRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('link to a soft-deleted Banco', () => {
    it('refuses to create a Conta in a soft-deleted Banco', async () => {
      const result = await service.createConta({ userId: USER_ID, nome: 'Ordenado', icon: 'bank', bancoId: 'BNC-APAGADO' } as never);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Banco not found');
      expect(bancoRepo.findActiveById).toHaveBeenCalledWith('BNC-APAGADO');
      expect(contaRepo.save).not.toHaveBeenCalled();
    });

    it('refuses to move a Conta to a soft-deleted Banco', async () => {
      contaRepo.findById.mockResolvedValue({
        userId: { toString: () => USER_ID },
        nome: { value: 'Ordenado' },
        icon: { value: 'bank' },
        saldo: { value: 10, moeda: 'EUR' },
        bancoId: 'BNC-ATUAL',
        id: { toString: () => CONTA_ID }
      });

      const result = await service.updateConta(CONTA_ID, { bancoId: 'BNC-APAGADO' } as never);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Banco not found');
      expect(contaRepo.update).not.toHaveBeenCalled();
    });
  });
});
