import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import UnidadeDeTrabalho, { repositorio } from '../UnidadeDeTrabalho.js';
import { Result } from '../../../core/logic/Result.js';

/** Any persistence entity: the unit of work only passes it through to getRepository. */
class Entidade {}

/**
 * The unit of work behind atomic edits/deletes of a Transacao (B0017, PR #94 review): the work runs in one TypeORM
 * transaction, a failed Result or a throw rolls it back, and repos resolve their repository from that transaction.
 */
describe('UnidadeDeTrabalho', () => {
  const repoDaTransacao = { origem: 'transação' };
  const repoForaDaTransacao = { origem: 'dataSource' };
  const manager = { getRepository: jest.fn(() => repoDaTransacao) };
  let estado: 'nenhuma' | 'commit' | 'rollback';
  let dataSource: { getRepository: jest.Mock; transaction: jest.Mock };
  let unidade: UnidadeDeTrabalho;

  beforeEach(() => {
    estado = 'nenhuma';
    manager.getRepository.mockImplementation(() => repoDaTransacao);
    dataSource = {
      getRepository: jest.fn(() => repoForaDaTransacao),
      // Mirrors DataSource.transaction: commits when the callback resolves, rolls back and rethrows when it throws
      transaction: jest.fn(async (trabalho: unknown) => {
        try {
          const r = await (trabalho as (m: typeof manager) => Promise<unknown>)(manager);
          estado = 'commit';
          return r;
        } catch (e) {
          estado = 'rollback';
          throw e;
        }
      })
    };
    unidade = new UnidadeDeTrabalho(dataSource as never);
  });

  it('commits when the work succeeds and returns its Result', async () => {
    const result = await unidade.executar(async () => Result.ok<number>(7));

    expect(result.getValue()).toBe(7);
    expect(estado).toBe('commit');
  });

  it('rolls back when the work returns a failed Result, and returns that Result', async () => {
    const result = await unidade.executar(async () => Result.fail<number>('Destination account not found'));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Destination account not found');
    expect(estado).toBe('rollback');
  });

  it('rolls back and rethrows when the work throws', async () => {
    await expect(unidade.executar(async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(estado).toBe('rollback');
  });

  it('gives repos the transaction repository inside the work, and the DataSource one outside it', async () => {
    let dentro: unknown;
    await unidade.executar(async () => {
      dentro = repositorio(dataSource as never, Entidade);
      return Result.ok<void>();
    });

    expect(dentro).toBe(repoDaTransacao);
    expect(repositorio(dataSource as never, Entidade)).toBe(repoForaDaTransacao);
  });

  it('joins the open transaction instead of opening a second one', async () => {
    await unidade.executar(() => unidade.executar(async () => Result.ok<void>()));

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
