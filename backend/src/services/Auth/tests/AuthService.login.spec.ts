import { jest, describe, it, expect } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import AuthService from '../AuthService.js';

/**
 * Soft-deleted users (B0015 / issue #89): only active users count. A deleted user cannot log in, and their email is
 * free again — registering it creates a new user.
 */

// Credential values are irrelevant to these tests, so they are generated: no credential-looking literal in the source.
const passwordGerada = () => `${randomUUID()}Aa1!`;

describe('AuthService.login — soft-deleted users', () => {
  it('rejects a login when no active user matches the email, without revealing that the account exists', async () => {
    const userRepo = { findActiveByEmail: jest.fn().mockResolvedValue(null) };
    const service = new AuthService(userRepo as never, { error: jest.fn() } as never);

    const credenciais = { email: 'apagado@exemplo.pt', password: passwordGerada() };
    const result = await service.login(credenciais as never);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Invalid credentials');
    expect(userRepo.findActiveByEmail).toHaveBeenCalledWith('apagado@exemplo.pt');
  });
});

describe('AuthService.registerUser — email of a soft-deleted user', () => {
  it('registers a new user when the only user with that email was soft-deleted', async () => {
    const userRepo = {
      findActiveByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (user: unknown) => user)
    };
    const service = new AuthService(userRepo as never, { error: jest.fn() } as never);

    const result = await service.registerUser({ email: 'apagado@exemplo.pt', name: 'Nova Pessoa', password: passwordGerada() });

    expect(result.isSuccess).toBe(true);
    expect(userRepo.findActiveByEmail).toHaveBeenCalledWith('apagado@exemplo.pt');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('still refuses an email that belongs to an active user', async () => {
    const userRepo = { findActiveByEmail: jest.fn().mockResolvedValue({}), save: jest.fn() };
    const service = new AuthService(userRepo as never, { error: jest.fn() } as never);

    const result = await service.registerUser({ email: 'ativo@exemplo.pt', name: 'Pessoa', password: passwordGerada() });

    expect(result.error).toBe('Email already in use');
    expect(userRepo.save).not.toHaveBeenCalled();
  });
});
