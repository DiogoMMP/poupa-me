import {Result} from "../../../core/logic/Result.js";
import { Transacao } from "../../../domain/Transacao/Entities/Transacao.js";
import type { ITransacaoDespesasRecorrentesFilters } from '../../../repos/Transacao/IRepos/ITransacaoDespesasRecorrentesRepo.js';
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
     * Find recurring expense transactions with optional filters.
     * Filters: bancoId, categoriaId, status, period, userId.
     */
    findDespesaRecorrente(filters?: ITransacaoDespesasRecorrentesFilters): Promise<Result<ITransacaoDTO[]>>;
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