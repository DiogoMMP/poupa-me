import { Result } from '../../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';

/**
 * Service interface for Cartão-based transaction queries (Crédito/Reembolso).
 */
export default interface ITransacaoCartaoQueryService {

    /** Find all Crédito/Reembolso transactions for a specific credit card. */
    findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find ALL Crédito/Reembolso transactions across every credit card (no cartaoCreditoId filter). */
    findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find Crédito/Reembolso transactions by category across all credit cards. */
    findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find Crédito/Reembolso transactions by status across all credit cards. */
    findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find Crédito/Reembolso transactions by predefined period across all credit cards. */
    findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;
}
