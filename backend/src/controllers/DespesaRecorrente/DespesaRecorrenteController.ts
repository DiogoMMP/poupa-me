import { Service, Inject } from 'typedi';
import type { Request, Response, NextFunction } from 'express';
import type IDespesaRecorrenteController from './IControllers/IDespesaRecorrenteController.js';
import type IDespesaRecorrenteService from '../../services/DespesaRecorrente/IServices/IDespesaRecorrenteService.js';
import type { AuthenticatedRequest } from '../../api/middlewares/isAuth.js';
import type { ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../../dto/IDespesaRecorrenteDTO.js';

/**
 * Controller handling HTTP requests for DespesaRecorrente CRUD endpoints
 */
@Service()
export default class DespesaRecorrenteController implements IDespesaRecorrenteController {

    constructor(
        @Inject('DespesaRecorrenteService') private despesaService: IDespesaRecorrenteService
    ) {}

    public async createDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = (currentUser.id || req.body?.userId || '') as string;

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

    public async updateDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const despesaId = req.params.id as string;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const dto = req.body as IUpdateDespesaRecorrenteDTO;
            const result = await this.despesaService.updateDespesa(despesaId, dto, userId, userRole);

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

    public async deleteDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const despesaId = req.params.id as string;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const result = await this.despesaService.deleteDespesa(despesaId, userId, userRole);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') return res.status(404).json({ error });
                if (error === 'Unauthorized') return res.status(403).json({ error });
                return res.status(400).json({ error });
            }

            return res.status(204).send();
        } catch (err) {
            next(err);
        }
    }

    public async getDespesa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const despesaId = req.params.id as string;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const result = await this.despesaService.getDespesa(despesaId, userId, userRole);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') return res.status(404).json({ error });
                if (error === 'Unauthorized') return res.status(403).json({ error });
                return res.status(400).json({ error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    public async getAllDespesas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const bancoId = req.query.bancoId as string | undefined;
            const result = await this.despesaService.getAllDespesas(userId, bancoId, userRole);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    public async getDespesasComValor(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const bancoId = req.query.bancoId as string | undefined;
            const result = await this.despesaService.getDespesasComValor(userId, bancoId, userRole);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }

    public async getDespesasSemValor(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const currentUser = (req as AuthenticatedRequest).currentUser;
            if (!currentUser || (!currentUser.id && currentUser.role !== 'Admin')) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userId = currentUser.id || '';
            const userRole = currentUser.role;

            const bancoId = req.query.bancoId as string | undefined;
            const tipo = req.query.tipo as string | undefined;

            const result = await this.despesaService.getDespesasSemValor(userId, bancoId, tipo, userRole);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }
}
