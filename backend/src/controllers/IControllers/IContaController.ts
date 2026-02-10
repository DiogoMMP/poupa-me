import type { NextFunction, Request, Response } from 'express';

export default interface IContaController {

    /**
     * Create a new conta
     * @param req - expects body with { nome: string, icon: string, userId?: string, saldo?: { valor: number, moeda: string } }
     * @param res - returns 201 with created conta or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    createConta(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Update an existing conta by ID (partial update supported)
     * @param req - expects params or query with { id: string } and body with any of { nome?: string, icon?: string }
     * @param res - returns 200 with updated conta or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    updateConta(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Delete a conta by its domain ID
     * @param req - expects params or query with { id: string }
     * @param res - returns 200 with { success: true } or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    deleteContaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Get a conta by its domain ID
     * @param req - expects params or query with { id: string }
     * @param res - returns 200 with conta data or 404 with error message
     * @param next - passes errors to error handling middleware
     */
    getContaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Get all contas for the authenticated user
     * @param req - expects authenticated request with currentUser.id
     * @param res - returns 200 with array of contas or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    getAllContas(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

