import {Result} from "../../core/logic/Result.js";
import type {
    IData,
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
     * Create and persist a Refund transaction linked to an original transaction.
     * @param inputDTO - Input data including the original transaction id (reembolso) to link.
     */
    createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Credit transaction (Crédito).
     * @param inputDTO - Input data for creating a Crédito transaction.
     */
    createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;

    /**
     * Create and persist a Monthly Expense transaction (Despesa Mensal).
     * @param inputDTO - Input data for creating a Despesa Mensal transaction.
     */
    createDespesaMensal(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;

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

    /**
     * Find transactions belonging to a specific category (by category domain id).
     * @param categoriaId - Category domain id used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findTransacaoByCategoria(categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find transactions by tipo (e.g., "Entrada", "Saída", "Crédito").
     * @param tipo - The tipo value used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findTransacaoByTipo(tipo: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find transactions by status (e.g., "Pendente", "Concluído").
     * @param status - The status value used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findTransacaoByStatus(status: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Find transactions created between two dates (inclusive).
     * @param startDate - Start of the date interval (inclusive).
     * @param endDate - End of the date interval (inclusive).
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findTransacaoByDateRange(startDate: IData, endDate: IData, userId?: string): Promise<Result<ITransacaoDTO[]>>;

    /**
     * Retrieve all transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findAllTransacoes(userId?: string): Promise<Result<ITransacaoDTO[]>>;
}