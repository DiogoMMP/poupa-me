import { Service, Inject } from 'typedi';
import type { Request, Response, NextFunction } from 'express';
import type IDespesaRecorrenteController from './IControllers/IDespesaRecorrenteController.js';
import type IDespesaRecorrenteService from '../services/IServices/IDespesaRecorrenteService.js';
import type { AuthenticatedRequest } from '../api/middlewares/isAuth.js';
import type { ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../dto/IDespesaRecorrenteDTO.js';

/**
 * Controller handling HTTP requests for DespesaRecorrente endpoints
 */
@Service()
export default class DespesaRecorrenteController implements IDespesaRecorrenteController {

    constructor(
        @Inject('DespesaRecorrenteService') private despesaService: IDespesaRecorrenteService
    ) {}

    /**
     * POST /despesa-recorrente - Create a new DespesaRecorrente
     */
    public async createDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const dto = req.body as ICreateDespesaRecorrenteDTO;
            const result = await this.despesaService.createDespesa(dto, userId);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(201).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /despesa-recorrente/:id - Update a DespesaRecorrente
     */
    public async updateDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const despesaId = req.params.id;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const dto = req.body as IUpdateDespesaRecorrenteDTO;
            const result = await this.despesaService.updateDespesa(despesaId, dto, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') {
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
     * DELETE /despesa-recorrente/:id - Delete a DespesaRecorrente
     */
    public async deleteDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const despesaId = req.params.id;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const result = await this.despesaService.deleteDespesa(despesaId, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') {
                    return res.status(404).json({ error });
                }
                if (error === 'Unauthorized') {
                    return res.status(401).json({ error });
                }
                return res.status(400).json({ error });
            }

            return res.status(200).json({ message: 'Despesa deleted successfully' });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /despesa-recorrente/:id - Get a DespesaRecorrente by ID
     */
    public async getDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const despesaId = req.params.id;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const result = await this.despesaService.getDespesa(despesaId, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') {
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
     * GET /despesa-recorrente - Get all DespesaRecorrentes for authenticated user
     */
    public async getAllDespesas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await this.despesaService.getAllDespesas(userId);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }
}

