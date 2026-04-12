import {Result} from "../../core/logic/Result.js";
import type {IEstatisticasDTO} from "../../dto/IEstatisticasDTO.js";

/**
 * Service interface for Estatisticas business logic
 */
export default interface IEstatisticasService {
    /**
     * Builds statistics for a specific banco and month/year.
     */

    getEstatisticas(bancoId: string, month: number, year: number, userId: string, userRole?: string): Promise<Result<IEstatisticasDTO>>;
}