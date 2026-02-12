import { Service, Inject } from 'typedi';
import type { Request, Response, NextFunction } from 'express';
import type IBancoController from './IControllers/IBancoController.js';
import type IBancoService from '../services/IServices/IBancoService.js';
import type { AuthenticatedRequest } from '../api/middlewares/isAuth.js';

/**
 * Controller handling HTTP requests for Banco endpoints
 */
@Service()
export default class BancoController implements IBancoController {

    constructor(
        @Inject('BancoService') private bancoService: IBancoService
    ) {}

    /**
     * POST /banco - Create a new Banco
     */
    public async createBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await this.bancoService.createBanco(req.body, userId);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(201).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /banco/:id - Update a Banco
     */
    public async updateBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const bancoId = req.params.id;
            if (!bancoId) {
                return res.status(400).json({ error: 'Banco ID is required' });
            }

            const result = await this.bancoService.updateBanco(bancoId, req.body, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Banco not found') {
                    return res.status(404).json({ error });
                }
                if (error === 'Unauthorized') {
                    return res.status(401).json({ error });
                }
                return res.status(400).json({ error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /banco/:id - Delete a Banco
     */
    public async deleteBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const bancoId = req.params.id;
            if (!bancoId) {
                return res.status(400).json({ error: 'Banco ID is required' });
            }

            const result = await this.bancoService.deleteBanco(bancoId, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Banco not found') {
                    return res.status(404).json({ error });
                }
                if (error === 'Unauthorized') {
                    return res.status(401).json({ error });
                }
                return res.status(400).json({ error });
            }

            return res.status(200).json({ message: 'Banco deleted successfully' });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /banco/:id - Get a Banco by ID
     */
    public async getBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const bancoId = req.params.id;
            if (!bancoId) {
                return res.status(400).json({ error: 'Banco ID is required' });
            }

            const result = await this.bancoService.getBanco(bancoId, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Banco not found') {
                    return res.status(404).json({ error });
                }
                if (error === 'Unauthorized') {
                    return res.status(401).json({ error });
                }
                return res.status(400).json({ error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /banco - Get all Bancos for authenticated user
     */
    public async getAllBancos(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await this.bancoService.getAllBancos(userId);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /banco/:id/dashboard - Get dashboard for a specific bank
     */
    public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const bancoId = req.params.id;
            if (!bancoId) {
                return res.status(400).json({ error: 'Banco ID is required' });
            }

            const result = await this.bancoService.getDashboard(bancoId, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Banco not found') {
                    return res.status(404).json({ error });
                }
                if (error === 'Unauthorized') {
                    return res.status(401).json({ error });
                }
                return res.status(400).json({ error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }
}
