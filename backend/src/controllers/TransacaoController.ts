import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoController from './IControllers/ITransacaoController.js';
import type ITransacaoService from '../services/IServices/ITransacaoService.js';
import type { ITransacaoInputDTO, ITransacaoReembolsoDTO, ITransacaoUpdateDTO } from '../dto/ITransacaoDTO.js';

/**
 * Controller implementation for Transacao operations
 */
@Service()
export default class TransacaoController implements ITransacaoController {
    constructor(
        @Inject('TransacaoService') private transacaoService: ITransacaoService
    ) {}

    /**
     * Handles the creation of a new Entrada transaction
     * @param req Express request object containing the transaction data in the body
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createEntrada(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            // attach authenticated user id
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createEntrada(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the creation of a new Saída transaction
     * @param req Express request object containing the transaction data in the body
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createSaida(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createSaida(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the creation of a new Reembolso transaction linked to an original transaction
     * @param req Express request object containing the transaction data in the body, including the original transaction id (reembolso)
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createReembolso(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoReembolsoDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createReembolso(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the creation of a new Crédito transaction
     * @param req Express request object containing the transaction data in the body
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createCredito(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createCredito(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the creation of a new Monthly Expense (Despesa Mensal) transaction
     * @param req Express request object containing the transaction data in the body
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createDespesaMensal(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles updating an existing Transacao identified by its domain id. The ID can be provided in the URL parameters or query parameters, and the updated properties are provided in the request body.
     * @param req Express request object containing the updated transaction data in the body, and the transaction ID in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async updateTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            const inputDTO = req.body as ITransacaoUpdateDTO;
            if (!id) return res.status(400).json({ error: 'ID is required to update transaction' });

            const result = await this.transacaoService.updateTransacao(id, inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles deleting a Transacao by its domain id. The ID can be provided in the URL parameters or query parameters.
     * @param req Express request object containing the transaction ID in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async deleteTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required to delete transaction' });

            const result = await this.transacaoService.deleteTransacao(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving a Transacao by its domain ID. The ID can be provided in the URL parameters or query parameters.
     * @param req Express request object containing the transaction ID in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getTransacaoById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const result = await this.transacaoService.findTransacaoById(id);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving transactions by category. The category ID can be provided in the URL parameters or query parameters using keys like "categoriaId" or "categoria".
     * @param req Express request object containing the category ID in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getTransacaoByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoriaId = (req.query.categoriaId || req.params.categoriaId || req.query.categoria || req.params.categoria) as string;
            if (!categoriaId) return res.status(400).json({ error: 'Categoria ID is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findTransacaoByCategoria(categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving transactions by tipo (e.g., "Entrada", "Saída", "Crédito"). The tipo can be provided in the URL parameters or query parameters using keys like "tipo".
     * @param req Express request object containing the tipo in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getTransacaoByTipo(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const tipo = (req.query.tipo || req.params.tipo) as string;
            if (!tipo) return res.status(400).json({ error: 'Tipo is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findTransacaoByTipo(tipo, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving transactions by status (e.g., "Pendente", "Concluído"). The status can be provided in the URL parameters or query parameters using keys
     * @param req Express request object containing the status in the URL parameters or query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getTransacaoByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const status = (req.query.status || req.params.status) as string;
            if (!status) return res.status(400).json({ error: 'Status is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findTransacaoByStatus(status, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving transactions that fall within a specified date range. The start and end dates can be provided in the query parameters using keys like "start" & "end" or "from" & "to". The method validates the presence and format of the dates, converts them to the expected IData shape, and then calls the service to retrieve the transactions within that date range.
     * @param req Express request object containing the start and end dates in the query parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getTransacaoByDateRange(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const start = (req.query.start || req.query.from) as string;
            const end = (req.query.end || req.query.to) as string;
            if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required (query: start & end)' });

            const startDate = new Date(start);
            const endDate = new Date(end);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return res.status(400).json({ error: 'Invalid date format' });

            // convert to IData shape expected by the service
            const startIData = { dia: startDate.getDate(), mes: startDate.getMonth() + 1, ano: startDate.getFullYear() };
            const endIData = { dia: endDate.getDate(), mes: endDate.getMonth() + 1, ano: endDate.getFullYear() };

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findTransacaoByDateRange(startIData, endIData, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all transactions. This method does not require any parameters and simply calls the service to get all transactions, returning them in the response.
     * @param req Express request object (not used in this method but included for consistency)
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getAllTransacoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findAllTransacoes(userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
