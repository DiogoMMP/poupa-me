import type { Result } from '../../../core/logic/Result.js';

/**
 * Runs a piece of work in a single database transaction, so that a multi-step operation (e.g. reverting the old
 * impact of a Transacao and applying the new one) is either fully persisted or not persisted at all.
 */
export default interface IUnidadeDeTrabalho {
    /**
     * Runs `trabalho` inside a database transaction. The transaction is committed when it returns a successful
     * Result, and rolled back when it returns a failed Result or throws (the error is rethrown). Calling it again
     * from inside a running unit of work joins the transaction that is already open.
     * @param trabalho The work to run; every repository call made through it uses the open transaction.
     * @returns The Result returned by `trabalho`.
     */
    executar<T>(trabalho: () => Promise<Result<T>>): Promise<Result<T>>;
}
