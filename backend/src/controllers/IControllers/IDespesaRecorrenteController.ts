import type { Request, Response, NextFunction } from 'express';

/**
 * Controller interface for DespesaRecorrente HTTP endpoints
 */
export default interface IDespesaRecorrenteController {
    /**
     * Creates a new DespesaRecorrente
     */
    createDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Updates an existing DespesaRecorrente
     */
    updateDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Deletes a DespesaRecorrente
     */
    deleteDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets a DespesaRecorrente by ID
     */
    getDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets all DespesaRecorrentes for the authenticated user
     */
    getAllDespesas(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets DespesaRecorrentes with valor + diaDoMes defined
     */
    getDespesasComValor(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets DespesaRecorrentes without valor + diaDoMes
     */
    getDespesasSemValor(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

