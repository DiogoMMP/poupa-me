import {Result} from "../../core/logic/Result.js";
import type {ICategoriaDTO, IInputCategoriaDTO} from "../../dto/ICategoriaDTO.js";

/**
 * Service interface for operations on `Categoria` (Category).
 * CRUD operations for the Categoria entity:
 * - Create Categoria
 * - Get Categoria by ID
 * - Get Categories by name
 * - Get all Categories
 * - Update Categoria
 * - Delete Categoria by ID
 */
export default interface ICategoriaService {

    /**
     * Creates and persists a Categoria.
     * @param inputDTO - Input data for creating/updating a Categoria.
     * @returns Result containing the DTO of the created/updated Categoria.
     */
    createCategoria(inputDTO: IInputCategoriaDTO): Promise<Result<ICategoriaDTO>>;

    /**
     * Retrieves a Categoria by its ID.
     * @param id - ID of the Categoria.
     * @returns Result containing the Categoria DTO or an error.
     */
    getCategoriaById(id: string): Promise<Result<ICategoriaDTO>>;

    /**
     * Retrieves all Categorias.
     * @returns Result containing an array with all Categoria DTOs.
     */
    getAllCategorias(): Promise<Result<ICategoriaDTO[]>>;

    /**
     * Updates an existing Categoria.
     * @param updateDTO - Input data for updating the Categoria.
     * @param id - The current id of the Categoria to find in the DB before updating.
     * @returns Result containing the updated Categoria DTO.
     */
    updateCategoria(updateDTO: IInputCategoriaDTO, id: string): Promise<Result<ICategoriaDTO>>;

    /**
     * Deletes a Categoria by its ID.
     * @param id - ID of the Categoria to delete.
     * @returns Result indicating success (true) or failure.
     */
    deleteCategoriaById(id: string): Promise<Result<boolean>>;
}