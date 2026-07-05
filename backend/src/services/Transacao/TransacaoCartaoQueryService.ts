import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type ITransacaoCartaoQueryService from './IServices/ITransacaoCartaoQueryService.js';
import type ITransacaoCartaoQueryRepo from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';
import type { ITransacaoCartaoQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Service responsible for Cartão-based transaction queries (Crédito/Reembolso).
 */
@Service()
export default class TransacaoCartaoQueryService implements ITransacaoCartaoQueryService {
    constructor(
        @Inject('TransacaoCartaoQueryRepo') private transacaoCartaoQueryRepo: ITransacaoCartaoQueryRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Finds Crédito/Reembolso transactions with optional filters.
     * Filters: userId, bancoId, cartaoCreditoId, categoriaId, status, period.
     */
    public async findAllCartaoTransactions(filters?: ITransacaoCartaoQueryFilters): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findAllCartaoTransactions(filters);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findAllCartaoTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions');
        }
    }
}
