import { Result } from '../../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';
import type { IPaginatedDTO, IPaginationParams } from '../../../dto/shared/IPaginatedDTO.js';
import type { ITransacaoContaQueryFilters } from '../../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';

/**
 * Service interface for Conta-based transaction queries (Entrada/Saída).
 */
export default interface ITransacaoContaQueryService {
    /** Find one page of Entrada/Saída transactions with optional filters (contaId, categoriaId, period, bancoId). */
    findAllContaTransactions(filters: ITransacaoContaQueryFilters, pagination: IPaginationParams): Promise<Result<IPaginatedDTO<ITransacaoDTO>>>;

    /** Find ALL transactions for a specific banco (conta + cartão). Returns 5 most recent. */
    findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;
}
