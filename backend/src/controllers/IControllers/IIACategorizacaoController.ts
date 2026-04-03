import type { Request, Response, NextFunction } from 'express';

export default interface IIACategorizacaoController {
    sugerirCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
