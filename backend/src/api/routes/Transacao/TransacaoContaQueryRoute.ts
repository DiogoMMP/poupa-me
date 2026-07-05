import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import type { AuthenticatedRequest } from '../../middlewares/index.js';
import TransacaoContaQueryController from '../../../controllers/Transacao/TransacaoContaQueryController.js';

const route = Router();

export default (app: Router) => {
  app.use('/transacao', route);

  const contaCtrl = Container.get(TransacaoContaQueryController);

  /**
   * @openapi
   * /transacao/all-conta:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get ALL Entrada/Saída transactions across every account
   *     description: Returns every conta-based transaction (Entrada and Saída) for the authenticated user, regardless of account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all conta transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
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
   *             examples:
   *               sample:
   *                 value:
   *                   - data:
   *                       dia: 17
   *                       mes: 1
   *                       ano: 2026
   *                     descricao: "Continente"
   *                     valor:
   *                       valor: 21.69
   *                       moeda: "EUR"
   *                     tipo: "Crédito"
   *                     status: "Pendente"
   *                     categoria:
   *                       id: "CAT00000000004"
   *                       nome: "Sem Categoria"
   *                     cartaoCredito:
   *                       id: "CCR00000000001"
   *                       nome: "Cartão Santander"
   *                       limiteCredito:
   *                         valor: 2098.02
   *                         moeda: "EUR"
   */
  route.get('/all-banco', isAuth, (req, res, next) => contaCtrl.getAllByBanco(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/conta:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get all Entrada/Saída transactions for a specific account
   *     description: Returns all conta-based transactions (Entrada and Saída) for a specific account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta to filter transactions by
   *     responses:
   *       200:
   *         description: List of conta transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/conta', isAuth, (req, res, next) => contaCtrl.getContaTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/conta/by-categoria:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get Entrada/Saída transactions by category across all accounts
   *     description: Returns conta transactions filtered by category across all accounts of the user. Requires authentication.
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
  route.get('/conta/by-categoria', isAuth, (req, res, next) => contaCtrl.getContaTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/conta/by-period:
   *   get:
   *     tags:
   *       - Transação - Queries Conta/Banco
   *     summary: Get Entrada/Saída transactions by predefined period across all accounts
   *     description: |-
   *       Returns conta transactions within a predefined period across all accounts of the user. Requires authentication.
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
  route.get('/conta/by-period', isAuth, (req, res, next) => contaCtrl.getContaTransactionsByPeriod(req as AuthenticatedRequest, res, next));
};
