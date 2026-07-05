import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Cartão-based transaction query endpoints.
 */
export default interface ITransacaoCartaoQueryController {
    getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
