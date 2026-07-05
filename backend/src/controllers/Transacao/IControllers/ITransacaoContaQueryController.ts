import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Conta-based transaction query endpoints.
 */
export default interface ITransacaoContaQueryController {
    getAllContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllByBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
