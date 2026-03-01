import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest, getEffectiveUserId } from '../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoController from './IControllers/ITransacaoController.js';
import type ITransacaoService from '../services/IServices/ITransacaoService.js';
import type { ITransacaoInputDTO, ITransacaoReembolsoDTO, ITransacaoUpdateDTO } from '../dto/ITransacaoDTO.js';

/**
 * Controller implementation for Transacao HTTP endpoints
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
     * Handles the creation of a new Poupança transaction (savings transfer).
     */
    public async createPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createPoupanca(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    public async concluirPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            const result = await this.transacaoService.concluirPoupanca(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
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

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
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

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoService.findCartaoTransactions(cartaoCreditoId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank
     */
    public async getDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoService.findDespesaRecorrente(bancoId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all Entrada/Saída transactions across every account (no contaId filter)
     */
    public async getAllContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findAllContaTransactions(userId, bancoId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all Crédito/Reembolso transactions across every credit card (no cartaoCreditoId filter)
     */
    public async getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findAllCartaoTransactions(userId, bancoId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Returns ALL transactions for a given banco. This ignores user ownership.
     */
    public async getAllByBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });

            const authReq = req as AuthenticatedRequest;
            const currentUser = authReq.currentUser;

            // If not authenticated for some reason, deny
            if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });

            // userId filter passed in query (optional)
            const requestedUserId = (req.query.userId || req.query.user_id) as string | undefined;

            let userIdForQuery: string | undefined;

            if (currentUser.role === 'Admin') {
                // Admin can see everything for banco, or can request a specific user's records by passing userId
                userIdForQuery = requestedUserId;
            } else {
                // Normal users can only see their own records
                if (requestedUserId && requestedUserId !== currentUser.id) {
                    return res.status(403).json({ error: 'Forbidden: cannot view other user transactions' });
                }
                userIdForQuery = currentUser.id;
            }

            const result = await this.transacaoService.findAllByBanco(bancoId, userIdForQuery);
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
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findContaTransactionsByCategoria(categoriaId, userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Crédito/Reembolso transactions by category across all credit cards
     */
    public async getCartaoTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findCartaoTransactionsByCategoria(categoriaId, userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving recurring expense transactions by category for a specific bank
     */
    public async getDespesaRecorrenteByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoService.findDespesaRecorrenteByCategoria(bancoId, categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    // --- Query Methods: Filter by Status ---

    /**
     * Handles retrieving Crédito and Reembolso transactions by status across all credit cards
     */
    public async getCartaoTransactionsByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const status = (req.query.status || req.params.status) as string;
            if (!status) return res.status(400).json({ error: 'status is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findCartaoTransactionsByStatus(status, userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving recurring expense transactions by status for a specific bank
     */
    public async getDespesaRecorrenteByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            const status = (req.query.status || req.params.status) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            if (!status) return res.status(400).json({ error: 'status is required' });

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoService.findDespesaRecorrenteByStatus(bancoId, status, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    // --- Query Methods: Filter by Period ---

    /**
     * Handles retrieving Entrada/Saída transactions by predefined period across all accounts
     */
    public async getContaTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const period = (req.query.period || req.params.period) as string;
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findContaTransactionsByPeriod(period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving Crédito/Reembolso transactions by predefined period across all credit cards
     */
    public async getCartaoTransactionsByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const period = (req.query.period || req.params.period) as string;
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoService.findCartaoTransactionsByPeriod(period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving recurring expense transactions by predefined period for a specific bank
     */
    public async getDespesaRecorrenteByPeriod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            const period = (req.query.period || req.params.period) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            if (!period) return res.status(400).json({ error: 'period is required' });

            const validPeriods = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({ error: `Period must be one of: ${validPeriods.join(', ')}` });
            }

            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoService.findDespesaRecorrenteByPeriod(bancoId, period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
