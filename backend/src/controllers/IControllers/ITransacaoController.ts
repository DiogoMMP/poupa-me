import type {NextFunction, Request, Response} from 'express';

/**
 * Controller interface for Transacao operations
 */
export default interface ITransacaoController {

    createEntrada(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createSaida(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createCredito(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createReembolso(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createDespesaSemanal(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createDespesaAnual(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    concluirDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    createPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    concluirPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    updateTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    deleteTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    getTransacaoById(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    // Get all by type
    getContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    // Get ALL (no id filter)
    getAllContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    // Filter by categoria
    getContaTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesaRecorrenteByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    // Filter by status
    getCartaoTransactionsByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesaRecorrenteByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    // Filter by period
    getContaTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getCartaoTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    getDespesaRecorrenteByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
