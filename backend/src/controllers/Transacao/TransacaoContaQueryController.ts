import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest, getEffectiveUserId } from '../../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoContaQueryController from './IControllers/ITransacaoContaQueryController.js';
import type ITransacaoContaQueryService from '../../services/Transacao/IServices/ITransacaoContaQueryService.js';
import type { ITransacaoContaQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';

/**
 * Controller for Conta-based transaction query endpoints (Entrada/Saída).
 */
@Service()
export default class TransacaoContaQueryController implements ITransacaoContaQueryController {
    constructor(
        @Inject('TransacaoContaQueryService') private transacaoContaQueryService: ITransacaoContaQueryService,
    ) {}

    public async getAllContaTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = req.query.bancoId as string | undefined;
            const contaId = req.query.contaId as string | undefined;
            const categoriaId = req.query.categoriaId as string | undefined;
            const period = req.query.period as string | undefined;

            if (period && !['Este Mês', 'Últimos 3 Meses', 'Último Ano'].includes(period)) {
                return res.status(400).json({ error: 'Period must be one of: Este Mês, Últimos 3 Meses, Último Ano' });
            }

            const filters: ITransacaoContaQueryFilters = {
                userId,
                bancoId,
                contaId,
                categoriaId,
                period: period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano' | undefined,
            };

            const result = await this.transacaoContaQueryService.findAllContaTransactions(filters);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getAllByBanco(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });

            const authReq = req as AuthenticatedRequest;
            const currentUser = authReq.currentUser;
            if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });

            const requestedUserId = (req.query.userId || req.query.user_id) as string | undefined;
            let userIdForQuery: string | undefined;

            if (currentUser.role === 'Admin') {
                userIdForQuery = requestedUserId;
            } else {
                if (requestedUserId && requestedUserId !== currentUser.id) {
                    return res.status(403).json({ error: 'Forbidden: cannot view other user transactions' });
                }
                userIdForQuery = currentUser.id;
            }

            const result = await this.transacaoContaQueryService.findAllByBanco(bancoId, userIdForQuery);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }
}
