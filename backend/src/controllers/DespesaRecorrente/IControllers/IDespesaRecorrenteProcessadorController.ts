import type { Request, Response, NextFunction } from 'express';

/**
 * Controller interface for DespesaRecorrente processor HTTP endpoints
 */
export default interface IDespesaRecorrenteProcessadorController {
    gerarTransacaoSemValor(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
