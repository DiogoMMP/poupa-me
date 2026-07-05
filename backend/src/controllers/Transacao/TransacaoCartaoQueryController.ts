import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest, getEffectiveUserId } from '../../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoCartaoQueryController from './IControllers/ITransacaoCartaoQueryController.js';
import type ITransacaoCartaoQueryService from '../../services/Transacao/IServices/ITransacaoCartaoQueryService.js';
import type { ITransacaoCartaoQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';

/**
 * Controller for Cartão-based transaction query endpoints (Crédito/Reembolso).
 */
@Service()
export default class TransacaoCartaoQueryController implements ITransacaoCartaoQueryController {
    constructor(
        @Inject('TransacaoCartaoQueryService') private transacaoCartaoQueryService: ITransacaoCartaoQueryService,
    ) {}

    public async getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = req.query.bancoId as string | undefined;
            const cartaoCreditoId = req.query.cartaoCreditoId as string | undefined;
            const categoriaId = req.query.categoriaId as string | undefined;
            const status = req.query.status as string | undefined;
            const period = req.query.period as string | undefined;

            if (period && !['Este Mês', 'Últimos 3 Meses', 'Último Ano'].includes(period)) {
                return res.status(400).json({ error: 'Period must be one of: Este Mês, Últimos 3 Meses, Último Ano' });
            }

            const filters: ITransacaoCartaoQueryFilters = {
                userId,
                bancoId,
                cartaoCreditoId,
                categoriaId,
                status,
                period: period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano' | undefined,
            };

            const result = await this.transacaoCartaoQueryService.findAllCartaoTransactions(filters);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }
}
