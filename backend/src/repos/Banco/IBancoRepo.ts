import type { Banco } from '../../domain/Banco/Entities/Banco.js';

/**
 * Repository interface for Banco. Defines CRUD operations.
 */
export default interface IBancoRepo {
    /**
     * Saves a new Banco to the database
     * @param banco - The Banco domain entity to save
     * @returns The saved Banco with updated persistence information
     */
    save(banco: Banco): Promise<Banco>;

    /**
     * Updates an existing Banco in the database
     * @param banco - The Banco domain entity with updated information
     * @returns The updated Banco
     */
    update(banco: Banco): Promise<Banco>;

    /**
     * Deletes a Banco from the database by its domain ID
     * @param bancoId - The domain ID of the Banco to delete
     */
    delete(bancoId: string): Promise<void>;

    /**
     * Finds a Banco by its domain ID
     * @param bancoId - The domain ID of the Banco to find
     * @returns The found Banco, or null if not found
     */
    findById(bancoId: string): Promise<Banco | null>;

    /**
     * Finds all Banco entities, optionally filtered by user ID
     * @param userId - Optional user domain ID to filter Banco records
     * @returns An array of Banco entities
     */
    findAll(userId?: string): Promise<Banco[]>;
}

