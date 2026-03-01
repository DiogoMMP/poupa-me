import type { Result } from '../../core/logic/Result.js';
import type { IBancoDTO, ICreateBancoDTO, IUpdateBancoDTO } from '../../dto/IBancoDTO.js';
import type { IDashboardDTO } from '../../dto/IDashboardDTO.js';

/**
 * Service interface for Banco business logic
 */
export default interface IBancoService {
    /**
     * Creates a new Banco
     * @param dto - Data for creating a Banco
     * @param userId - User domain ID creating the Banco
     * @returns Result containing the created Banco DTO or error
     */
    createBanco(dto: ICreateBancoDTO, userId: string): Promise<Result<IBancoDTO>>;

    /**
     * Updates an existing Banco
     * @param bancoId - Domain ID of the Banco to update
     * @param dto - Data for updating the Banco
     * @param userId - User domain ID (for authorization)
     * @param userRole - User role (Admin bypasses ownership check)
     * @returns Result containing the updated Banco DTO or error
     */
    updateBanco(bancoId: string, dto: IUpdateBancoDTO, userId: string, userRole?: string): Promise<Result<IBancoDTO>>;

    /**
     * Deletes a Banco
     * @param bancoId - Domain ID of the Banco to delete
     * @param userId - User domain ID (for authorization)
     * @param userRole - User role (Admin bypasses ownership check)
     * @returns Result indicating success or error
     */
    deleteBanco(bancoId: string, userId: string, userRole?: string): Promise<Result<void>>;

    /**
     * Gets a Banco by ID
     * @param bancoId - Domain ID of the Banco
     * @param userId - User domain ID (for authorization)
     * @param userRole - User role (Admin bypasses ownership check)
     * @returns Result containing the Banco DTO or error
     */
    getBanco(bancoId: string, userId: string, userRole?: string): Promise<Result<IBancoDTO>>;

    /**
     * Gets all Bancos for a user (or all if Admin)
     * @param userId - User domain ID
     * @param userRole - User role (Admin sees all bancos)
     * @returns Result containing array of Banco DTOs or error
     */
    getAllBancos(userId: string, userRole?: string): Promise<Result<IBancoDTO[]>>;

    /**
     * Gets the dashboard for a specific bank with its totals
     * @param bancoId - Domain ID of the Banco
     * @param userId - User domain ID (for authorization)
     * @param userRole - User role (Admin can access any banco's dashboard)
     * @returns Result containing dashboard data for the specific bank
     */
    getDashboard(bancoId: string, userId: string, userRole?: string): Promise<Result<IDashboardDTO>>;
}
