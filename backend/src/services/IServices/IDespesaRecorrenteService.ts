import type { Result } from '../../core/logic/Result.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../../dto/IDespesaRecorrenteDTO.js';

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
     * Gets all DespesaRecorrentes for a user
     */
    getAllDespesas(userId: string): Promise<Result<IDespesaRecorrenteDTO[]>>;

    /**
     * Processes recurring expenses for a user (called on login/dashboard load)
     */
    processarRecorrencias(userId: string): Promise<Result<void>>;
}

