
import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type IEstatisticasController from './IControllers/IEstatisticasController.js';
import type IEstatisticasService from '../services/IServices/IEstatisticasService.js';
import { type AuthenticatedRequest } from '../api/middlewares/isAuth.js';

@Service()
export default class EstatisticasController implements IEstatisticasController {
	constructor(
		@Inject('EstatisticasService') private estatisticasService: IEstatisticasService
	) {}

	public async getEstatisticas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
		try {
			const bancoId = (req.query.bancoId || req.params.bancoId) as string;
			if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });

			const monthQuery = (req.query.month || req.query.m) as string | undefined;
			const yearQuery = (req.query.year || req.query.y) as string | undefined;

			const today = new Date();
			const month = monthQuery ? Number.parseInt(monthQuery, 10) : (today.getMonth() + 1);
			const year = yearQuery ? Number.parseInt(yearQuery, 10) : today.getFullYear();

			const authReq = req as AuthenticatedRequest;
			const currentUser = authReq.currentUser;
			if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });

			const result = await this.estatisticasService.getEstatisticas(bancoId, month, year, currentUser.id, currentUser.role);
			if (result.isFailure) return res.status(500).json({ error: result.error });
			return res.status(200).json(result.getValue());
		} catch (e) {
			next(e);
		}
	}
}


