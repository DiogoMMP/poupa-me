import { jest, describe, it, expect } from '@jest/globals';
import CartaoCreditoService from '../CartaoCreditoService.js';

/**
 * Deleting a cartão is allowed to its owner and to an Admin only (B0015 / issue #89).
 */
describe('CartaoCreditoService.deleteCartao — autorização', () => {
  const CARTAO_ID = 'CRT00000000001';
  const DONO = 'USR00000000001';

  const build = (cartao: unknown) => {
    const cartaoRepo = {
      findById: jest.fn().mockResolvedValue(cartao),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    const service = new CartaoCreditoService(
      cartaoRepo as never, {} as never, {} as never, {} as never, {} as never, {} as never, { error: jest.fn() }
    );
    return { service, cartaoRepo };
  };
  const cartaoDe = (userId: string) => ({ userId: { toString: () => userId } });

  it('refuses a user who does not own the cartão', async () => {
    const { service, cartaoRepo } = build(cartaoDe(DONO));

    const result = await service.deleteCartao(CARTAO_ID, 'USR-OUTRO', 'User');

    expect(result.error).toBe('Unauthorized');
    expect(cartaoRepo.delete).not.toHaveBeenCalled();
  });

  it('allows the owner to soft-delete the cartão', async () => {
    const { service, cartaoRepo } = build(cartaoDe(DONO));

    const result = await service.deleteCartao(CARTAO_ID, DONO, 'User');

    expect(result.isSuccess).toBe(true);
    expect(cartaoRepo.delete).toHaveBeenCalledWith(CARTAO_ID);
  });

  it('allows an Admin to soft-delete any cartão', async () => {
    const { service, cartaoRepo } = build(cartaoDe(DONO));

    const result = await service.deleteCartao(CARTAO_ID, 'USR-ADMIN', 'Admin');

    expect(result.isSuccess).toBe(true);
    expect(cartaoRepo.delete).toHaveBeenCalledWith(CARTAO_ID);
  });
});
