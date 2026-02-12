import type { Request, Response, NextFunction } from 'express';

/**
 * Controller interface for Banco HTTP endpoints
 */
export default interface IBancoController {
    /**
     * Creates a new Banco
     */
    createBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Updates an existing Banco
     */
    updateBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Deletes a Banco
     */
    deleteBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets a Banco by ID
     */
    getBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets all Bancos for the authenticated user
     */
    getAllBancos(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets dashboard with global and per-bank totals
     */
    getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
