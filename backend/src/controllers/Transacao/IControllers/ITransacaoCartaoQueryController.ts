import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Cartão-based transaction query endpoints.
 */
export default interface ITransacaoCartaoQueryController {
    getCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactionsByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
