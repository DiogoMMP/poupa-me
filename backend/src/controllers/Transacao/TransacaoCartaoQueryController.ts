import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest, getEffectiveUserId } from '../../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoCartaoQueryController from './IControllers/ITransacaoCartaoQueryController.js';
import type ITransacaoCartaoQueryService from '../../services/Transacao/IServices/ITransacaoCartaoQueryService.js';

/**
 * Controller for Cartão-based transaction query endpoints (Crédito/Reembolso).
 */
@Service()
export default class TransacaoCartaoQueryController implements ITransacaoCartaoQueryController {
    constructor(
        @Inject('TransacaoCartaoQueryService') private transacaoCartaoQueryService: ITransacaoCartaoQueryService,
    ) {}

    public async getCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const cartaoCreditoId = (req.query.cartaoCreditoId || req.params.cartaoCreditoId) as string;
            if (!cartaoCreditoId) return res.status(400).json({ error: 'cartaoCreditoId is required' });
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const result = await this.transacaoCartaoQueryService.findCartaoTransactions(cartaoCreditoId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getAllCartaoTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoCartaoQueryService.findAllCartaoTransactions(userId, bancoId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getCartaoTransactionsByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoCartaoQueryService.findCartaoTransactionsByCategoria(categoriaId, userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getCartaoTransactionsByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const status = (req.query.status || req.params.status) as string;
            if (!status) return res.status(400).json({ error: 'status is required' });
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = (req.query.bancoId) as string | undefined;
            const result = await this.transacaoCartaoQueryService.findCartaoTransactionsByStatus(status, userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

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
            const result = await this.transacaoCartaoQueryService.findCartaoTransactionsByPeriod(period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId, bancoId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }
}
