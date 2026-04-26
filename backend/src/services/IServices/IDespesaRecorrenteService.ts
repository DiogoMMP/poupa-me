import type { Result } from '../../core/logic/Result.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO, IGerarTransacaoSemValorDTO } from '../../dto/IDespesaRecorrenteDTO.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';

/**
 * Service interface for DespesaRecorrente business logic
 */
export default interface IDespesaRecorrenteService {
    /**
     * Creates a new DespesaRecorrente
     */
    createDespesa(dto: ICreateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;

    /**
     * Updates an existing DespesaRecorrente
     */
    updateDespesa(despesaId: string, dto: IUpdateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;

    /**
     * Deletes a DespesaRecorrente
     */
    deleteDespesa(despesaId: string, userId: string): Promise<Result<void>>;

    /**
     * Gets a DespesaRecorrente by ID
     */
    getDespesa(despesaId: string, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;

    /**
     * Gets all DespesaRecorrentes for a user, optionally filtered by bank
     */
    getAllDespesas(userId: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>>;

    /**
     * Gets DespesaRecorrentes that have valor + diaDoMes defined,
     * filtered to those whose origin account belongs to the given bank
     */
    getDespesasComValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>>;

    /**
     * Gets sem-valor DespesaRecorrentes by tipo for a user, optionally filtered by bank
     */
    getDespesasSemValorByTipo(userId: string, tipo: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>>;

    /**
     * Gets DespesaRecorrentes without valor + diaDoMes (icon/nome only),
     * filtered to those whose origin account belongs to the given bank
     */
    getDespesasSemValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>>;

    /**
     * Processes recurring expenses for a user (called on login/dashboard load)
     */
    processarRecorrencias(userId: string): Promise<Result<void>>;

    /**
     * Manually generates a pending transaction for a sem-valor recurring expense rule.
     * The rule itself is NOT modified — valor and diaDoMes are only used for this transaction.
     */
    gerarTransacaoSemValor(despesaId: string, dto: IGerarTransacaoSemValorDTO, userId: string): Promise<Result<ITransacaoDTO>>;
}
