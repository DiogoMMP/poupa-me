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
     * Handles the creation of a new Reembolso transaction
     * @param req Express request object containing the transaction data in the body
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
     * Handles concluding a Despesa Mensal (change from Pendente to Concluído and subtract from destination account)
     * @param req Express request object containing the transaction ID in the URL parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async concluirDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).json({ error: 'Transaction ID is required' });

            const result = await this.transacaoService.concluirDespesaMensal(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
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

    // --- Query Methods: Get All by Type ---

    /**
     * Handles retrieving all Entrada/Saída transactions (conta-based) for a specific account
     */
    public async getContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findContaTransactions(contaId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all Crédito/Reembolso transactions (cartão-based) for a specific credit card
     */
    public async getCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const cartaoCreditoId = (req.query.cartaoCreditoId || req.params.cartaoCreditoId) as string;
            if (!cartaoCreditoId) return res.status(400).json({ error: 'cartaoCreditoId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findCartaoTransactions(cartaoCreditoId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all Despesa Mensal transactions for a specific account
     */
    public async getDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findDespesaMensal(contaId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    // --- Query Methods: Filter by Categoria ---

    /**
     * Handles retrieving Entrada/Saída transactions by category for a specific account
     */
    public async getContaTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findContaTransactionsByCategoria(contaId, categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Crédito/Reembolso transactions by category for a specific credit card
     */
    public async getCartaoTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const cartaoCreditoId = (req.query.cartaoCreditoId || req.params.cartaoCreditoId) as string;
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!cartaoCreditoId) return res.status(400).json({ error: 'cartaoCreditoId is required' });
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findCartaoTransactionsByCategoria(cartaoCreditoId, categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Despesa Mensal transactions by category for a specific account
     */
    public async getDespesaMensalByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findDespesaMensalByCategoria(contaId, categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    // --- Query Methods: Filter by Status (one for cartão, one for despesa mensal) ---

    /**
     * Handles retrieving Crédito and Reembolso transactions by status for a specific credit card
     */
    public async getCartaoTransactionsByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const cartaoCreditoId = (req.query.cartaoCreditoId || req.params.cartaoCreditoId) as string;
            const status = (req.query.status || req.params.status) as string;
            if (!cartaoCreditoId) return res.status(400).json({ error: 'cartaoCreditoId is required' });
            if (!status) return res.status(400).json({ error: 'status is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findCartaoTransactionsByStatus(cartaoCreditoId, status, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Despesa Mensal transactions by status for a specific account
     */
    public async getDespesaMensalByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            const status = (req.query.status || req.params.status) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });
            if (!status) return res.status(400).json({ error: 'status is required' });

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findDespesaMensalByStatus(contaId, status, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    // --- Query Methods: Filter by Period (one per type) ---

    /**
     * Handles retrieving Entrada/Saída transactions by predefined period for a specific account
     */
    public async getContaTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            const period = (req.query.period || req.params.period) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findContaTransactionsByPeriod(contaId, period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Crédito/Reembolso transactions by predefined period for a specific credit card
     */
    public async getCartaoTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const cartaoCreditoId = (req.query.cartaoCreditoId || req.params.cartaoCreditoId) as string;
            const period = (req.query.period || req.params.period) as string;
            if (!cartaoCreditoId) return res.status(400).json({ error: 'cartaoCreditoId is required' });
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findCartaoTransactionsByPeriod(cartaoCreditoId, period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Despesa Mensal transactions by predefined period for a specific account
     */
    public async getDespesaMensalByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const contaId = (req.query.contaId || req.params.contaId) as string;
            const period = (req.query.period || req.params.period) as string;
            if (!contaId) return res.status(400).json({ error: 'contaId is required' });
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.findDespesaMensalByPeriod(contaId, period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
