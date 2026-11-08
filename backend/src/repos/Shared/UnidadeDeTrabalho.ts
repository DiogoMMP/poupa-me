import { AsyncLocalStorage } from 'node:async_hooks';
import { Service, Inject } from 'typedi';
import type { DataSource, EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import type IUnidadeDeTrabalho from './IRepos/IUnidadeDeTrabalho.js';
import type { Result } from '../../core/logic/Result.js';

/** The EntityManager of the transaction opened by the unit of work the current call runs in, if any. */
const transacaoAtual = new AsyncLocalStorage<EntityManager>();

/**
 * Returns the TypeORM repository a repo must use for `entidade`: the one bound to the open unit of work when the
 * call runs inside one, so that its reads see the writes already made in it and its writes are rolled back with it;
 * otherwise the DataSource's own repository, as before.
 * @param dataSource The DataSource injected in the repo.
 * @param entidade The persistence entity.
 */
export function repositorio<E extends ObjectLiteral>(dataSource: DataSource, entidade: EntityTarget<E>): Repository<E> {
    return (transacaoAtual.getStore() ?? dataSource).getRepository(entidade);
}

/** Thrown inside the TypeORM transaction only to roll it back when the work returns a failed Result. */
class Reverter extends Error {}

/**
 * TypeORM implementation of IUnidadeDeTrabalho. Repos opt in by resolving their repositories through `repositorio`.
 */
@Service()
export default class UnidadeDeTrabalho implements IUnidadeDeTrabalho {
    constructor(@Inject('dataSource') private dataSource: DataSource) {}

    public async executar<T>(trabalho: () => Promise<Result<T>>): Promise<Result<T>> {
        if (transacaoAtual.getStore()) return trabalho();

        let resultado: Result<T> | undefined;
        try {
            await this.dataSource.transaction(manager => transacaoAtual.run(manager, async () => {
                resultado = await trabalho();
                if (resultado.isFailure) throw new Reverter();
            }));
        } catch (e) {
            if (!(e instanceof Reverter)) throw e;
        }
        return resultado as Result<T>;
    }
}
