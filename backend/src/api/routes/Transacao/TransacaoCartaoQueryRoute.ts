import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import type { AuthenticatedRequest } from '../../middlewares/index.js';
import TransacaoCartaoQueryController from '../../../controllers/Transacao/TransacaoCartaoQueryController.js';

const route = Router();

export default (app: Router) => {
  app.use('/transacao', route);

  const cartaoCtrl = Container.get(TransacaoCartaoQueryController);

  /**
   * @openapi
   * /transacao/all-cartao:
   *   get:
   *     tags:
   *       - Transação - Queries Cartão
   *     summary: Get ALL Crédito/Reembolso transactions across credit cards with optional filters
   *     description: Returns cartão-based transactions (Crédito and Reembolso) for the authenticated user. Optional filters can be applied via query parameters. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cartaoCreditoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the CartaoCredito to filter by
   *       - in: query
   *         name: categoriaId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Categoria to filter by
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: ["Pendente", "Concluído"]
   *         description: Status to filter by
   *       - in: query
   *         name: period
   *         required: false
   *         schema:
   *           type: string
   *           enum: ["Este Mês", "Últimos 3 Meses", "Último Ano"]
   *         description: Predefined period to filter by
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco to filter by
   *     responses:
   *       200:
   *         description: List of cartão transactions matching the criteria
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/all-cartao', isAuth, (req, res, next) => cartaoCtrl.getAllCartaoTransactions(req as AuthenticatedRequest, res, next));
};
