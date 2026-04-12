import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import EstatisticasController from '../../controllers/EstatisticasController.js';

const route = Router();

/**
 * @openapi
 * /estatisticas:
 *   get:
 *     tags:
 *       - Estatisticas
 *     summary: Get statistics for a banco
 *     description: Returns monthly cashflow, category aggregation and daily history for a given banco. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bancoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain id of the Banco to build statistics for
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *         description: Month number (1-12). If omitted uses current month. When month/year equals current month/year, service uses a rolling 1-month window (today-1month .. today).
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Year number. If omitted uses current year.
 *     responses:
 *       200:
 *         description: Statistics payload
 */
export default (app: Router) => {
  app.use('/estatisticas', route);

  const ctrl = Container.get(EstatisticasController);

  route.get('/', isAuth, (req, res, next) => ctrl.getEstatisticas(req as AuthenticatedRequest, res, next));
};

