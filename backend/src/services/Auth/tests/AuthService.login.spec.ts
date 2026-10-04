import { jest, describe, it, expect } from '@jest/globals';
import AuthService from '../AuthService.js';

/**
 * A soft-deleted user (B0015 / issue #89) must not log in. The lookup used by login only returns active users,
 * and the failure is the same generic one used for an unknown email.
 */
describe('AuthService.login — soft-deleted users', () => {
  it('rejects a login when no active user matches the email, without revealing that the account exists', async () => {
    const userRepo = {
      findActiveByEmail: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn()
    };
    const service = new AuthService(userRepo as never, { error: jest.fn() } as never);

    const result = await service.login({ email: 'apagado@exemplo.pt', password: 'qualquer' } as never);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Invalid credentials');
    expect(userRepo.findActiveByEmail).toHaveBeenCalledWith('apagado@exemplo.pt');
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });
});
