import type {NextFunction, Request, Response} from 'express';

/**
 * Controller interface for Transacao operations
 */
export default interface ITransacaoController {

    createEntrada(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createSaida(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createReembolso(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createCredito(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    updateTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    deleteTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoByTipo(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoByDateRange(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getAllTransacoes(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

