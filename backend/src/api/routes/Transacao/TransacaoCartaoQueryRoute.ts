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
   *     summary: Get ALL Crédito/Reembolso transactions across every credit card
   *     description: Returns every cartão-based transaction (Crédito and Reembolso) for the authenticated user, regardless of credit card. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all cartão transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/all-cartao', isAuth, (req, res, next) => cartaoCtrl.getAllCartaoTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao:
   *   get:
   *     tags:
   *       - Transação - Queries Cartão
   *     summary: Get all Crédito/Reembolso transactions for a specific credit card
   *     description: Returns all cartão-based transactions (Crédito and Reembolso) for a specific credit card. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cartaoCreditoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the CartaoCredito to filter transactions by
   *     responses:
   *       200:
   *         description: List of cartão transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/cartao', isAuth, (req, res, next) => cartaoCtrl.getCartaoTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-categoria:
   *   get:
   *     tags:
   *       - Transação - Queries Cartão
   *     summary: Get Crédito/Reembolso transactions by category across all credit cards
   *     description: Returns cartão transactions filtered by category across all credit cards of the user. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: categoriaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Categoria
   *     responses:
   *       200:
   *         description: Matching transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/cartao/by-categoria', isAuth, (req, res, next) => cartaoCtrl.getCartaoTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-status:
   *   get:
   *     tags:
   *       - Transação - Queries Cartão
   *     summary: Get Crédito/Reembolso transactions by status across all credit cards
   *     description: Returns Crédito and Reembolso transactions filtered by status across all credit cards of the user. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         required: true
   *         schema:
   *           type: string
   *           enum: ["Pendente","Concluído"]
   *     responses:
   *       200:
   *         description: Matching transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/cartao/by-status', isAuth, (req, res, next) => cartaoCtrl.getCartaoTransactionsByStatus(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-period:
   *   get:
   *     tags:
   *       - Transação - Queries Cartão
   *     summary: Get Crédito/Reembolso transactions by predefined period across all credit cards
   *     description: |-
   *       Returns cartão transactions within a predefined period across all credit cards of the user. Requires authentication.
   *       Valid periods: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         required: true
   *         schema:
   *           type: string
   *           enum: ["Este Mês", "Últimos 3 Meses", "Último Ano"]
   *     responses:
   *       200:
   *         description: Matching transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/cartao/by-period', isAuth, (req, res, next) => cartaoCtrl.getCartaoTransactionsByPeriod(req as AuthenticatedRequest, res, next));
};
