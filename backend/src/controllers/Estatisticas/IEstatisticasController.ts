import type { NextFunction, Request, Response } from 'express';

/**
 * Controller interface for Estatisticas endpoints
 */
export default interface IEstatisticasController {
	getEstatisticas(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}


