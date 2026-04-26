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
     * Finds all DespesaRecorrentes for a user, optionally filtered by bank
     */
    findAll(userId: string, bancoId?: string): Promise<DespesaRecorrente[]>;

    /**
     * Finds all active DespesaRecorrentes for a user
     */
    findActiveByUserId(userId: string): Promise<DespesaRecorrente[]>;

    /**
     * Finds DespesaRecorrentes that have valor and diaDoMes defined,
     * filtered to those whose origin account belongs to the given bank
     */
    findWithValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]>;

    /**
     * Finds sem-valor DespesaRecorrentes by tipo for a user, optionally filtered by bank
     */
    findByTipo(userId: string, tipo: string, bancoId?: string): Promise<DespesaRecorrente[]>;

    /**
     * Finds DespesaRecorrentes that have no valor and no diaDoMes (icon/nome only),
     * filtered to those whose origin account belongs to the given bank
     */
    findWithoutValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]>;
}
