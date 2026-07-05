import type { Request, Response, NextFunction } from 'express';

/**
 * Controller interface for DespesaRecorrente CRUD HTTP endpoints
 */
export default interface IDespesaRecorrenteController {
    createDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    updateDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    deleteDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllDespesas(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesasComValor(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesasSemValor(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
