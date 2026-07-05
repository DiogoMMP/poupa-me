import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for core Transacao operations (create, update, delete, get, despesas recorrentes).
 */
export default interface ITransacaoController {
    createEntrada(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createSaida(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createCredito(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createReembolso(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createDespesaSemanal(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createDespesaAnual(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    createPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    concluirPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    concluirDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    updateTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    deleteTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getTransacaoById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
