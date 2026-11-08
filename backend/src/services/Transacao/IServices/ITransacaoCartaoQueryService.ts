import { Result } from '../../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';
import type { IPaginatedDTO, IPaginationParams } from '../../../dto/shared/IPaginatedDTO.js';
import type { ITransacaoCartaoQueryFilters } from '../../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';

/**
 * Service interface for Cartão-based transaction queries (Crédito/Reembolso).
 */
export default interface ITransacaoCartaoQueryService {
    /** Find one page of Crédito/Reembolso transactions with optional filters (cartaoCreditoId, categoriaId, status, period, bancoId). */
    findAllCartaoTransactions(filters: ITransacaoCartaoQueryFilters, pagination: IPaginationParams): Promise<Result<IPaginatedDTO<ITransacaoDTO>>>;
}
