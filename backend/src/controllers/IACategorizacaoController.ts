import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type IIACategorizacaoController from './IControllers/IIACategorizacaoController.js';
import type IIACategorizacaoService from '../services/IServices/IIACategorizacaoService.js';

@Service()
export default class IACategorizacaoController implements IIACategorizacaoController {
    constructor(
        @Inject('IACategorizacaoService') private aiCategorizacaoService: IIACategorizacaoService
    ) {}

    /**
     * Endpoint to suggest a category for a given transaction description.
     */
    public async sugerirCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // Read from query since it's now a GET request
            const description = req.query.description as string;
            if (!description) {
                return res.status(400).json({ error: 'Descrição em falta.' });
            }

            const result = await this.aiCategorizacaoService.suggestCategory(description);

            if (result.isFailure) {
                return res.status(500).json({ error: result.error });
            }

            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
