import type { DespesaRecorrente } from '../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';

/**
 * Interface for DespesaRecorrente repository
 */
export default interface IDespesaRecorrenteRepo {
    /**
     * Saves a DespesaRecorrente
     */
    save(despesa: DespesaRecorrente): Promise<DespesaRecorrente>;

    /**
     * Updates a DespesaRecorrente
     */
    update(despesa: DespesaRecorrente): Promise<DespesaRecorrente>;

    /**
     * Deletes a DespesaRecorrente by domain ID
     */
    delete(despesaId: string): Promise<void>;

    /**
     * Finds a DespesaRecorrente by domain ID
     */
    findById(despesaId: string): Promise<DespesaRecorrente | null>;

    /**
     * Finds all DespesaRecorrentes for a user
     */
    findAll(userId: string): Promise<DespesaRecorrente[]>;

    /**
     * Finds all active DespesaRecorrentes for a user
     */
    findActiveByUserId(userId: string): Promise<DespesaRecorrente[]>;
}

