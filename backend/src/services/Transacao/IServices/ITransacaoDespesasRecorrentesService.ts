import {Result} from "../../../core/logic/Result.js";
import { Transacao } from "../../../domain/Transacao/Entities/Transacao.js";
import type {
    ITransacaoDTO,
    ITransacaoInputDTO
} from "../../../dto/ITransacaoDTO.js";

/**
 * Service interface for operations on `Transacao` (Transaction).
 */
export default interface ITransacaoDespesasRecorrentesService {
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
     * Find all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrente(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;
    /**
     * Find recurring expense transactions by category for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param categoriaId - Category domain id used to filter transactions.
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrenteByCategoria(bancoId: string, categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;
    /**
     * Find recurring expense transactions by status for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param status - The status value used to filter transactions (e.g., "Pendente", "Concluído").
     * @param userId - Optional user id to scope the search to a specific user's transactions.
     */
    findDespesaRecorrenteByStatus(bancoId: string, status: string, userId?: string): Promise<Result<ITransacaoDTO[]>>;
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

    revertDespesaRecorrenteImpact(transacao: Transacao): Promise<Result<void>>;
    revertPoupancaImpact(transacao: Transacao): Promise<Result<void>>;
    applyDespesaRecorrenteImpact(transacao: Transacao): Promise<Result<void>>;
    applyPoupancaImpact(transacao: Transacao): Promise<Result<void>>;

}