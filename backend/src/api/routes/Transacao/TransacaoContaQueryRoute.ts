import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import type { AuthenticatedRequest } from '../../middlewares/index.js';
import TransacaoContaQueryController from '../../../controllers/Transacao/TransacaoContaQueryController.js';

const route = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PaginatedTransacao:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transacao'
 *         page:
 *           type: integer
 *           example: 2
 *         pageSize:
 *           type: integer
 *           enum: [10, 25, 50, 100]
 *           example: 25
 *         totalPages:
 *           type: integer
 *           example: 4
 *         totalItems:
 *           type: integer
 *           example: 87
 */

export default (app: Router) => {
  app.use('/transacao', route);

  const contaCtrl = Container.get(TransacaoContaQueryController);

  /**
   * @openapi
   * /transacao/all-conta:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get ALL Entrada/Saída transactions across accounts with optional filters
   *     description: Returns conta-based transactions (Entrada and Saída) for the authenticated user. Optional filters can be applied via query parameters. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta to filter by
   *       - in: query
   *         name: categoriaId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Categoria to filter by
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
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number (1-based)
   *       - in: query
   *         name: pageSize
   *         required: false
   *         schema:
   *           type: integer
   *           enum: [10, 25, 50, 100]
   *           default: 25
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: One page of conta transactions matching the criteria
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedTransacao'
   *       400:
   *         description: Invalid period, page or pageSize
   */
  route.get('/all-conta', isAuth, (req, res, next) => contaCtrl.getAllContaTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/all-banco:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get ALL transactions for a banco
   *     description: Returns the 5 most recent transactions for the authenticated user, optionally filtered by banco. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco to filter transactions by
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: List of all transactions for the banco
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/all-banco', isAuth, (req, res, next) => contaCtrl.getAllByBanco(req as AuthenticatedRequest, res, next));
};
