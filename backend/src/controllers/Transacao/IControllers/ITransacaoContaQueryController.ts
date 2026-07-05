import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Conta-based transaction query endpoints.
 */
export default interface ITransacaoContaQueryController {
    getContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllByBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getContaTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getContaTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
