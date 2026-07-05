import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type ITransacaoContaQueryService from './IServices/ITransacaoContaQueryService.js';
import type ITransacaoContaQueryRepo from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
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
     * Finds all Entrada and Saída transactions for a specific account.
     */
    public async findContaTransactions(contaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findContaTransactions(contaId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions');
        }
    }

    /**
     * Finds ALL Entrada/Saída transactions across every account (no contaId filter).
     */
    public async findAllContaTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findAllContaTransactions(userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findAllContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching all conta transactions');
        }
    }

    /**
     * Finds ALL transactions for a specific banco (conta + cartão).
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

    /**
     * Finds Entrada/Saída transactions by category across all accounts.
     */
    public async findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findContaTransactionsByCategoria(categoriaId, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findContaTransactionsByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions by categoria');
        }
    }

    /**
     * Finds Entrada/Saída transactions by predefined period across all accounts.
     */
    public async findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findContaTransactionsByPeriod(period, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findContaTransactionsByPeriod error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions by period');
        }
    }
}
