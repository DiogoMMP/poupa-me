import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Import operations
 */
export default interface IImportController {

    /**
     * Imports accounts (Contas) from CSV file
     */
    importContas(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Imports transactions (Entradas, Saídas, and optionally Despesas Mensais) from CSV files
     */
    importTransacoes(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

