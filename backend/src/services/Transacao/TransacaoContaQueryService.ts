import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type ITransacaoContaQueryService from './IServices/ITransacaoContaQueryService.js';
import type ITransacaoContaQueryRepo from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
import type { ITransacaoContaQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Service responsible for Conta-based transaction queries (Entrada/Saída).
 */
@Service()
export default class TransacaoContaQueryService implements ITransacaoContaQueryService {
    constructor(
        @Inject('TransacaoContaQueryRepo') private transacaoContaQueryRepo: ITransacaoContaQueryRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Finds Entrada/Saída transactions with optional filters.
     * Filters: userId, bancoId, contaId, categoriaId, period.
     */
    public async findAllContaTransactions(filters?: ITransacaoContaQueryFilters): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findAllContaTransactions(filters);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findAllContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions');
        }
    }

    /**
     * Finds ALL transactions for a specific banco (conta + cartão). Returns 5 most recent.
     */
    public async findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findAllByBanco(bancoId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findAllByBanco error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions for banco');
        }
    }
}
