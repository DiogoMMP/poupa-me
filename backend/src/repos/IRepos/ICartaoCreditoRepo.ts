import type { CartaoCredito } from '../../domain/CartaoCredito/Entities/CartaoCredito.js';

/**
 * Repository interface for CartaoCredito. Defines the contract for persistence operations.
 */
export default interface ICartaoCreditoRepo {
    /**
     * Saves a new CartaoCredito to the database.
     * @param cartao - The CartaoCredito domain entity to save
     * @returns The saved CartaoCredito with updated persistence information
     */
    save(cartao: CartaoCredito): Promise<CartaoCredito>;

    /**
     * Updates an existing CartaoCredito in the database.
     * @param cartao - The CartaoCredito domain entity with updated information
     * @returns The updated CartaoCredito
     */
    update(cartao: CartaoCredito): Promise<CartaoCredito>;

    /**
     * Deletes a CartaoCredito from the database by its domain ID.
     * @param cartaoId - The domain ID of the CartaoCredito to delete
     */
    delete(cartaoId: string): Promise<void>;

    /**
     * Finds a CartaoCredito by its domain ID.
     * @param cartaoId - The domain ID of the CartaoCredito to find
     * @returns The found CartaoCredito, or null if not found
     */
    findById(cartaoId: string): Promise<CartaoCredito | null>;

    /**
     * Finds all CartaoCredito entities, optionally filtered by user ID.
     * @param userId - Optional user domain ID to filter CartaoCredito records
     * @returns An array of CartaoCredito entities
     */
    findAll(userId?: string): Promise<CartaoCredito[]>;
}

