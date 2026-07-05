import { Result } from '../../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';

/**
 * Service interface for Conta-based transaction queries (Entrada/Saída).
 */
export default interface ITransacaoContaQueryService {

    /** Find all Entrada/Saída transactions for a specific account. */
    findContaTransactions(contaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find ALL Entrada/Saída transactions across every account (no contaId filter). */
    findAllContaTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find ALL transactions for a specific banco (conta + cartão). */
    findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find Entrada/Saída transactions by category across all accounts. */
    findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /** Find Entrada/Saída transactions by predefined period across all accounts. */
    findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;
}
