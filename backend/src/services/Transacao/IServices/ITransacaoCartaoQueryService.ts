import { Result } from '../../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';
import type { ITransacaoCartaoQueryFilters } from '../../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';

/**
 * Service interface for Cartão-based transaction queries (Crédito/Reembolso).
 */
export default interface ITransacaoCartaoQueryService {
    /** Find Crédito/Reembolso transactions with optional filters (cartaoCreditoId, categoriaId, status, period, bancoId). */
    findAllCartaoTransactions(filters?: ITransacaoCartaoQueryFilters): Promise<Result<ITransacaoDTO[]>>;
}
