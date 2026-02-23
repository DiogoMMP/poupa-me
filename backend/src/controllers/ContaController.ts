import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest, getEffectiveUserId } from '../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type IContaController from './IControllers/IContaController.js';
import type IContaService from '../services/IServices/IContaService.js';
import type { IContaInputDTO } from '../dto/IContaDTO.js';

/**
 * Controller for handling HTTP requests related to Conta entities. Delegates business logic to ContaService.
 */
@Service()
export default class ContaController implements IContaController {
    constructor(
        @Inject('ContaService') private contaService: IContaService
    ) {}

    /**
     * Handles the creation of a new conta. Expects a JSON body with nome, icon, optional userId and saldo. If userId
     * is not provided, it uses the authenticated user's ID. Returns the created conta or an error message.
     * @param req - expects body with { nome: string, icon: string, userId?: string, saldo?: { valor: number, moeda: string } }
     * @param res - returns 201 with created conta or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    public async createConta(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as IContaInputDTO;
            // set user from authenticated request if not provided
            inputDTO.userId = inputDTO.userId ?? (req as AuthenticatedRequest).currentUser?.id;

            const result = await this.contaService.createConta(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles updating an existing conta. Supports partial updates. Expects an ID in either params or query and a
     * JSON body with any of the updatable fields.
     * @param req - expects params or query with { id: string } and body with any of { nome?: string, icon?: string }
     * @param res - returns 200 with updated conta or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    public async updateConta(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // support patch semantics: id in params or query
            const id = (req.params.id || req.query.id) as string;
            const inputDTO = req.body as Partial<IContaInputDTO>;
            if (!id) return res.status(400).json({ error: 'ID is required to update conta' });

            const result = await this.contaService.updateConta(id, inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles deleting a conta by its domain ID. Expects the ID in either params or query. Returns success status or error message.
     * @param req - expects params or query with { id: string }
     * @param res - returns 200 with { success: true } or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    public async deleteContaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required to delete conta' });

            const result = await this.contaService.deleteConta(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving a conta by its domain ID. Expects the ID in either params or query. Returns the conta data or an error message.
     * @param req - expects params or query with { id: string }
     * @param res - returns 200 with conta data or 404 with error message
     * @param next - passes errors to error handling middleware
     */
    public async getContaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const result = await this.contaService.findContaById(id);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all contas for the authenticated user. Optionally accepts a bancoId query parameter to filter
     * results by banco. Returns an array of contas or an error message.
     * @param req - expects authenticated request with currentUser.id and optional query parameter bancoId
     * @param res - returns 200 with array of contas or 400 with error message
     * @param next - passes errors to error handling middleware
     */
    public async getAllContas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // Admins get undefined so no userId filter is applied (see all contas)
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = req.query.bancoId as string | undefined;
            const result = await this.contaService.findAllContas(userId, bancoId);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
