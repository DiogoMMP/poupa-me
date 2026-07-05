import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type ITransacaoCartaoQueryService from './IServices/ITransacaoCartaoQueryService.js';
import type ITransacaoCartaoQueryRepo from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';
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
     * Finds all Crédito/Reembolso transactions for a specific credit card.
     */
    public async findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findCartaoTransactions(cartaoCreditoId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findCartaoTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions');
        }
    }

    /**
     * Finds ALL Crédito/Reembolso transactions across every credit card (no cartaoCreditoId filter).
     */
    public async findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findAllCartaoTransactions(userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findAllCartaoTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching all cartão transactions');
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by category across all credit cards.
     */
    public async findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findCartaoTransactionsByCategoria(categoriaId, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findCartaoTransactionsByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by categoria');
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by status across all credit cards.
     */
    public async findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findCartaoTransactionsByStatus(status, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findCartaoTransactionsByStatus error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by status');
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by predefined period across all credit cards.
     */
    public async findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoCartaoQueryRepo.findCartaoTransactionsByPeriod(period, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findCartaoTransactionsByPeriod error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by period');
        }
    }
}
