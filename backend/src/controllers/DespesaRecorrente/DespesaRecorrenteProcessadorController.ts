import { Service, Inject } from 'typedi';
import type { Request, Response, NextFunction } from 'express';
import type IDespesaRecorrenteProcessadorController from './IControllers/IDespesaRecorrenteProcessadorController.js';
import type IDespesaRecorrenteProcessadorService from '../../services/DespesaRecorrente/IServices/IDespesaRecorrenteProcessadorService.js';
import type { AuthenticatedRequest } from '../../api/middlewares/isAuth.js';
import type { IGerarTransacaoSemValorDTO } from '../../dto/IDespesaRecorrenteDTO.js';

/**
 * Controller handling HTTP requests for DespesaRecorrente processing endpoints
 */
@Service()
export default class DespesaRecorrenteProcessadorController implements IDespesaRecorrenteProcessadorController {

    constructor(
        @Inject('DespesaRecorrenteProcessadorService') private processadorService: IDespesaRecorrenteProcessadorService
    ) {}

    public async gerarTransacaoSemValor(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const despesaId = req.params.id as string;
            if (!despesaId) {
                return res.status(400).json({ error: 'Despesa ID is required' });
            }

            const dto = req.body as IGerarTransacaoSemValorDTO;
            if (!dto.valor || dto.valor.valor === undefined || !dto.valor.moeda) {
                return res.status(400).json({ error: 'valor (valor + moeda) é obrigatório' });
            }
            if (!dto.data || dto.data.dia < 1 || dto.data.dia > 31 || dto.data.mes < 1 || dto.data.mes > 12 || dto.data.ano < 2000) {
                return res.status(400).json({ error: 'data (dia, mes, ano) inválida' });
            }

            const result = await this.processadorService.gerarTransacaoSemValor(despesaId, dto, userId);

            if (result.isFailure) {
                const error = result.error;
                if (error === 'Despesa not found') return res.status(404).json({ error });
                if (error === 'Unauthorized') return res.status(403).json({ error });
                return res.status(400).json({ error });
            }

            return res.status(201).json(result.getValue());
        } catch (err) {
            next(err);
        }
    }
}
