import type { Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest } from '../../api/middlewares/isAuth.js';
import { Service, Inject } from 'typedi';
import type ITransacaoController from './IControllers/ITransacaoController.js';
import type ITransacaoService from '../../services/Transacao/IServices/ITransacaoService.js';
import type ITransacaoDespesasRecorrentesService from '../../services/Transacao/IServices/ITransacaoDespesasRecorrentesService.js';
import type { ITransacaoInputDTO, ITransacaoReembolsoDTO, ITransacaoUpdateDTO } from '../../dto/ITransacaoDTO.js';

/**
 * Controller for core Transacao operations: create, update, delete, getById and despesas recorrentes.
 */
@Service()
export default class TransacaoController implements ITransacaoController {
    constructor(
        @Inject('TransacaoService') private transacaoService: ITransacaoService,
        @Inject('TransacaoDespesasRecorrentesService') private despesasRecorrentesService: ITransacaoDespesasRecorrentesService,
    ) {}

    public async createEntrada(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createEntrada(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createSaida(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createSaida(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createCredito(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createCredito(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createReembolso(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoReembolsoDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.transacaoService.createReembolso(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createDespesaMensal(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const imediata = inputDTO.imediata ?? false;
            const result = await this.despesasRecorrentesService.createDespesaMensal(inputDTO, imediata);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createDespesaSemanal(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const imediata = inputDTO.imediata ?? false;
            const result = await this.despesasRecorrentesService.createDespesaSemanal(inputDTO, imediata);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createDespesaAnual(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const imediata = inputDTO.imediata ?? false;
            const result = await this.despesasRecorrentesService.createDespesaAnual(inputDTO, imediata);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async createPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ITransacaoInputDTO;
            inputDTO.userId = (req as AuthenticatedRequest).currentUser?.id;
            const imediata = inputDTO.imediata ?? false;
            const result = await this.despesasRecorrentesService.createPoupanca(inputDTO, imediata);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async concluirPoupanca(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            const result = await this.despesasRecorrentesService.concluirPoupanca(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async concluirDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = req.params.id as string;
            const result = await this.despesasRecorrentesService.concluirDespesaRecorrente(id);
            if (result.isFailure) return res.status(400).json({ message: result.errorValue() });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async updateTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            const inputDTO = req.body as ITransacaoUpdateDTO;
            if (!id) return res.status(400).json({ error: 'ID is required to update transaction' });
            const result = await this.transacaoService.updateTransacao(id, inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async deleteTransacao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required to delete transaction' });
            const result = await this.transacaoService.deleteTransacao(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) { next(e); }
    }

    public async getTransacaoById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            const result = await this.transacaoService.findTransacaoById(id);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getDespesaRecorrente(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.despesasRecorrentesService.findDespesaRecorrente(bancoId, userId);
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getDespesaRecorrenteByCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            const categoriaId = (req.query.categoriaId || req.params.categoriaId) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            if (!categoriaId) return res.status(400).json({ error: 'categoriaId is required' });
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.despesasRecorrentesService.findDespesaRecorrenteByCategoria(bancoId, categoriaId, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

    public async getDespesaRecorrenteByStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const bancoId = (req.query.bancoId || req.params.bancoId) as string;
            const status = (req.query.status || req.params.status) as string;
            if (!bancoId) return res.status(400).json({ error: 'bancoId is required' });
            if (!status) return res.status(400).json({ error: 'status is required' });
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.despesasRecorrentesService.findDespesaRecorrenteByStatus(bancoId, status, userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }

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
            const userId = (req as AuthenticatedRequest).currentUser?.id;
            const result = await this.despesasRecorrentesService.findDespesaRecorrenteByPeriod(bancoId, period as 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) { next(e); }
    }
}
