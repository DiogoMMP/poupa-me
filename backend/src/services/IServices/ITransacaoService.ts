import {Result} from "../../core/logic/Result.js";
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO
} from "../../dto/ITransacaoDTO.js";

/**
 * Service interface for operations on `Transacao` (Transaction).
 *
 * Provides factory-style create methods for the different transaction types used in the domain
 * (Entrada, Saída, Reembolso, Crédito, Despesa Mensal) as well as standard CRUD and query operations.
 */
export default interface ITransacaoService {

    /**
     * Create and persist an Income transaction (Entrada).
     * @param inputDTO - Input data for creating an Entrada transaction.
     * @returns Result containing the created transaction DTO.
     */
    createEntrada(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist an Expense transaction (Saída).
     * @param inputDTO - Input data for creating a Saída transaction.
     */
    createSaida(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Credit transaction (Crédito).
     * @param inputDTO - Input data for creating a Crédito transaction.
     */
    createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Refund transaction (Reembolso).
     * @param inputDTO - Input data for creating a Reembolso transaction.
     */
    createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Despesa Mensal transaction.
     * @param inputDTO - Input data for creating a Despesa Mensal transaction.
     * @param imediata - If true the status is "Concluído" otherwise "Pendente".
     */
    createDespesaMensal(inputDTO: ITransacaoInputDTO, imediata?: boolean): Promise<Result<ITransacaoDTO>>;

    /**
     * Conclude a Despesa Recorrente (change from Pendente to Concluído and subtract from destination account).
     * @param transacaoId - The domain ID of the Despesa Mensal transaction to conclude.
     */
    concluirDespesaRecorrente(transacaoId: string): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Savings transfer transaction (Poupança).
     * Transfers money from origin account to a savings account (contaPoupanca).
     * @param inputDTO - Input data (requires contaId origin and contaPoupancaId destination).
     * @param imediata - If true the status is "Concluído" otherwise "Pendente".
     */
    createPoupanca(inputDTO: ITransacaoInputDTO, imediata?: boolean): Promise<Result<ITransacaoDTO>>;

    /**
     * Conclude a Poupança transaction (change from Pendente to Concluído and add to savings account).
     * @param transacaoId - The domain ID of the Poupança transaction to conclude.
     */
    concluirPoupanca(transacaoId: string): Promise<Result<ITransacaoDTO>>;

    /**
     * Update an existing Transacao identified by its domain id.
     * @param id - The domain id of the transaction to update.
     * @param updateDTO - Partial properties to update on the transaction.
     */
    updateTransacao(id: string, updateDTO: ITransacaoUpdateDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Delete a Transacao by its domain id.
     * @param id - Domain id of the transaction to delete.
     */
    deleteTransacao(id: string): Promise<Result<boolean>>;

    /**
     * Find a Transacao by its domain id.
     * @param id - Domain id to look up.
     */
    findTransacaoById(id: string): Promise<Result<ITransacaoDTO>>;

    // --- Get all by type ---

    /**
     * Find all Entrada/Saída transactions (conta-based) for a specific account.
     * @param contaId - The domain id of the Conta to filter transactions by.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findContaTransactions(contaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find all Crédito/Reembolso transactions (cartão-based) for a specific credit card.
     * @param cartaoCreditoId - The domain id of the CartaoCredito to filter transactions by.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrente(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find ALL Entrada/Saída transactions across every account (no contaId filter).
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findAllContaTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find ALL Crédito/Reembolso transactions across every credit card (no cartaoCreditoId filter).
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    // Get ALL transactions for a given banco
    findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    // --- Filter by categoria (one per type) ---

    /**
     * Find Entrada/Saída transactions by category across all accounts.
     * @param categoriaId - Category domain id used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find Crédito/Reembolso transactions by category across all credit cards.
     * @param categoriaId - Category domain id used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find recurring expense transactions by category for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param categoriaId - Category domain id used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrenteByCategoria(bancoId: string, categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    // --- Filter by status (one for cartão, one for despesa recorrente) ---

    /**
     * Find Crédito and Reembolso transactions by status across all credit cards.
     * @param status - The status value used to filter transactions (e.g., "Pendente", "Concluído").
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find recurring expense transactions by status for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param status - The status value used to filter transactions (e.g., "Pendente", "Concluído").
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrenteByStatus(bancoId: string, status: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    // --- Filter by period (one per type) ---

    /**
     * Find Entrada/Saída transactions by predefined period across all accounts.
     * @param period - Predefined period: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find Crédito/Reembolso transactions by predefined period across all credit cards.
     * @param period - Predefined period: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     * @param bancoId - Optional banco domain id to filter by bank.
     */
    findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find recurring expense transactions by predefined period for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param period - Predefined period: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrenteByPeriod(bancoId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Create and persist a Weekly Expense transaction (Despesa Semanal).
     * @param inputDTO - Input data for creating a Despesa Semanal transaction.
     * @param imediata - If true the status is "Concluído" otherwise "Pendente".
     */
    createDespesaSemanal(inputDTO: ITransacaoInputDTO, imediata?: boolean): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist an Annual Expense transaction (Despesa Anual).
     * @param inputDTO - Input data for creating a Despesa Anual transaction.
     * @param imediata - If true the status is "Concluído" otherwise "Pendente".
     */
    createDespesaAnual(inputDTO: ITransacaoInputDTO, imediata?: boolean): Promise<Result<ITransacaoDTO>>;
}