import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import TransacaoController from '../../controllers/TransacaoController.js';

const route = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     IData:
 *       type: object
 *       properties:
 *         dia:
 *           type: integer
 *           example: 11
 *         mes:
 *           type: integer
 *           example: 02
 *         ano:
 *           type: integer
 *           example: 2026
 *     IDinheiroProps:
 *       type: object
 *       properties:
 *         valor:
 *           type: number
 *           example: 12.34
 *         moeda:
 *           type: string
 *           example: EUR
 *     Transacao:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         tipo:
 *           type: string
 *           enum: ["Entrada","Saída","Crédito","Reembolso","Despesa Mensal"]
 *         status:
 *           type: string
 *           enum: ["Pendente","Concluído"]
 *         categoria:
 *           $ref: '#/components/schemas/Categoria'
 *         conta:
 *           $ref: '#/components/schemas/Conta'
 *         contaId:
 *           type: string
 *           description: Domain id of the associated account (when present)
 *         userId:
 *           type: string
 *           description: Domain id of the owning user
 *     TransacaoInput:
 *       type: object
 *       required: [data, descricao, valor, categoriaId, contaId]
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         categoriaId:
 *           type: string
 *         contaId:
 *           type: string
 *           description: Domain id of the account where the transaction will be registered
 *       example:
 *         data:
 *           dia: 11
 *           mes: 02
 *           ano: 2026
 *         descricao: "Salário recebido"
 *         valor:
 *           valor: 1500.00
 *           moeda: "EUR"
 *         categoriaId: "CAT00000000001"
 *         contaId: "CNT00000000001"
 *      # userId will be set by the server from the authenticated user; clients SHOULD NOT provide it.
 *     TransacaoReembolsoInput:
 *       type: object
 *       required: [data, descricao, valor, categoriaId, cartaoCreditoId]
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         categoriaId:
 *           type: string
 *         cartaoCreditoId:
 *           type: string
 *           description: Domain id of the credit card where the reembolso will be registered
 *       example:
 *         data:
 *           dia: 11
 *           mes: 02
 *           ano: 2026
 *         descricao: "Reembolso de compra"
 *         valor:
 *           valor: 25.00
 *           moeda: "EUR"
 *         categoriaId: "CAT00000000001"
 *         cartaoCreditoId: "CCR00000000001"
 *     TransacaoCreditoInput:
 *       type: object
 *       required: [data, descricao, valor, categoriaId, cartaoCreditoId]
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         categoriaId:
 *           type: string
 *         cartaoCreditoId:
 *           type: string
 *           description: Domain id of the credit card where the transaction will be registered
 *       example:
 *         data:
 *           dia: 10
 *           mes: 2
 *           ano: 2026
 *         descricao: "Compra supermercado"
 *         valor:
 *           valor: 50.00
 *           moeda: "EUR"
 *         categoriaId: "CAT00000000001"
 *         cartaoCreditoId: "CCR00000000001"
 *     TransacaoUpdate:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         tipo:
 *           type: string
 *           enum: ["Entrada","Saída","Crédito","Reembolso","Despesa Mensal"]
 *         categoriaId:
 *           type: string
 *         contaId:
 *           type: string
 *         cartaoCreditoId:
 *           type: string
 *         contaDestinoId:
 *           type: string
 *           description: Destination account for Despesa Mensal
 *         status:
 *           type: string
 *           enum: ["Pendente","Concluído"]
 */

export default (app: Router) => {
  app.use('/transacao', route);

  const ctrl = Container.get(TransacaoController);

  /**
   * @openapi
   * /transacao/entrada:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create an Entrada transaction
   *     description: Creates a new transaction of type Entrada. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoInput'
   *           example:
   *             data:
   *               dia: 11
   *               mes: 02
   *               ano: 2026
   *             descricao: "Salário recebido"
   *             valor:
   *               valor: 1500.00
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             contaId: "CNT00000000001"
   *     responses:
   *       201:
   *         description: Transacao created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transacao'
   *       400:
   *         description: Validation failed
   */
  route.post('/entrada', isAuth, (req, res, next) => ctrl.createEntrada(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/saida:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Saída transaction
   *     description: Creates a new transaction of type Saída. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoInput'
   *           example:
   *             data:
   *               dia: 11
   *               mes: 02
   *               ano: 2026
   *             descricao: "Compra supermercado"
   *             valor:
   *               valor: 45.50
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             contaId: "CNT00000000001"
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/saida', isAuth, (req, res, next) => ctrl.createSaida(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/credito:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Crédito transaction
   *     description: Creates a new Crédito transaction on a credit card. The system will add to card utilization and subtract from the associated payment account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoCreditoInput'
   *           example:
   *             data:
   *               dia: 10
   *               mes: 2
   *               ano: 2026
   *             descricao: "Compra supermercado"
   *             valor:
   *               valor: 50.00
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             cartaoCreditoId: "CCR00000000001"
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/credito', isAuth, (req, res, next) => ctrl.createCredito(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/reembolso:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Reembolso transaction
   *     description: Creates a new Reembolso transaction on a credit card. The system will add to the associated payment account and reduce card utilization. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoReembolsoInput'
   *           example:
   *             data:
   *               dia: 11
   *               mes: 2
   *               ano: 2026
   *             descricao: "Reembolso de compra"
   *             valor:
   *               valor: 25.00
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             cartaoCreditoId: "CCR00000000001"
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/reembolso', isAuth, (req, res, next) => ctrl.createReembolso(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Despesa Mensal transaction (Pendente)
   *     description: |-
   *       Creates a new monthly expense with status "Pendente".
   *       Subtracts from origin account (contaId) and adds to destination account (contaDestinoId).
   *       Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - data
   *               - descricao
   *               - valor
   *               - categoriaId
   *               - contaId
   *               - contaDestinoId
   *             properties:
   *               data:
   *                 type: object
   *                 properties:
   *                   dia:
   *                     type: integer
   *                   mes:
   *                     type: integer
   *                   ano:
   *                     type: integer
   *               descricao:
   *                 type: string
   *               valor:
   *                 type: object
   *                 properties:
   *                   valor:
   *                     type: number
   *                   moeda:
   *                     type: string
   *               categoriaId:
   *                 type: string
   *               contaId:
   *                 type: string
   *                 description: Origin account (where money is subtracted from)
   *               contaDestinoId:
   *                 type: string
   *                 description: Destination account (where money is added to)
   *           example:
   *             data:
   *               dia: 11
   *               mes: 02
   *               ano: 2026
   *             descricao: "Pagamento mensal de serviço"
   *             valor:
   *               valor: 30.00
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             contaId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *     responses:
   *       201:
   *         description: Despesa Mensal created with status Pendente
   */
  route.post('/despesa-mensal', isAuth, (req, res, next) => ctrl.createDespesaMensal(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal/concluir/{id}:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Conclude a Despesa Mensal transaction
   *     description: |-
   *       Concludes a monthly expense by changing status from "Pendente" to "Concluído"
   *       and subtracting the amount from the destination account (contaDestinoId).
   *       Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Despesa Mensal transaction
   *     responses:
   *       200:
   *         description: Despesa Mensal concluded successfully
   *       400:
   *         description: Invalid transaction or already concluded
   *       404:
   *         description: Transaction not found
   */
  route.post('/despesa-mensal/concluir/:id', isAuth, (req, res, next) => ctrl.concluirDespesaMensal(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Get All by Type ---

  /**
   * @openapi
   * /transacao/conta:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/conta', isAuth, (req, res, next) => ctrl.getContaTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/cartao', isAuth, (req, res, next) => ctrl.getCartaoTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get all Despesa Mensal transactions for a specific account
   *     description: Returns all monthly expense transactions for a specific account. Requires authentication.
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
   *         description: List of despesa mensal transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/despesa-mensal', isAuth, (req, res, next) => ctrl.getDespesaMensal(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Categoria ---

  /**
   * @openapi
   * /transacao/conta/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Entrada/Saída transactions by category for a specific account
   *     description: Returns conta transactions filtered by category for a specific account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta
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
  route.get('/conta/by-categoria', isAuth, (req, res, next) => ctrl.getContaTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Crédito/Reembolso transactions by category for a specific credit card
   *     description: Returns cartão transactions filtered by category for a specific credit card. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cartaoCreditoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the CartaoCredito
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
  route.get('/cartao/by-categoria', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Despesa Mensal transactions by category for a specific account
   *     description: Returns despesa mensal transactions filtered by category for a specific account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta
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
  route.get('/despesa-mensal/by-categoria', isAuth, (req, res, next) => ctrl.getDespesaMensalByCategoria(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Status (one for cartão, one for despesa mensal) ---

  /**
   * @openapi
   * /transacao/cartao/by-status:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Crédito/Reembolso transactions by status for a specific credit card
   *     description: Returns Crédito and Reembolso transactions filtered by status for a specific credit card. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cartaoCreditoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the CartaoCredito
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
  route.get('/cartao/by-status', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByStatus(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal/by-status:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Despesa Mensal transactions by status for a specific account
   *     description: Returns Despesa Mensal transactions filtered by status for a specific account. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta
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
  route.get('/despesa-mensal/by-status', isAuth, (req, res, next) => ctrl.getDespesaMensalByStatus(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Period (one per type) ---

  /**
   * @openapi
   * /transacao/conta/by-period:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Entrada/Saída transactions by predefined period for a specific account
   *     description: |-
   *       Returns conta transactions within a predefined period for a specific account. Requires authentication.
   *       Valid periods: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta
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
  route.get('/conta/by-period', isAuth, (req, res, next) => ctrl.getContaTransactionsByPeriod(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-period:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Crédito/Reembolso transactions by predefined period for a specific credit card
   *     description: |-
   *       Returns cartão transactions within a predefined period for a specific credit card. Requires authentication.
   *       Valid periods: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cartaoCreditoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the CartaoCredito
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
  route.get('/cartao/by-period', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByPeriod(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal/by-period:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get Despesa Mensal transactions by predefined period for a specific account
   *     description: |-
   *       Returns despesa mensal transactions within a predefined period for a specific account. Requires authentication.
   *       Valid periods: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: contaId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Conta
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
  route.get('/despesa-mensal/by-period', isAuth, (req, res, next) => ctrl.getDespesaMensalByPeriod(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/{id}:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get transaction by ID
   *     description: Returns a single transaction by domain ID. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: The transaction
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transacao'
   *       404:
   *         description: Not found
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getTransacaoById(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/{id}:
   *   patch:
   *     tags:
   *       - Transacao
   *     summary: Partially update a transaction
   *     description: Apply a partial update to transaction fields. Requires authentication (any role). The transaction to update is identified by the `id` path parameter.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoUpdate'
   *     responses:
   *       200:
   *         description: Updated transaction
   */
  route.patch('/:id', isAuth, (req, res, next) => ctrl.updateTransacao(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/{id}:
   *   delete:
   *     tags:
   *       - Transacao
   *     summary: Delete a transaction by id
   *     description: Removes a transaction identified by its domain ID. Requires authentication (any role).
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Deletion successful
   */
  route.delete('/:id', isAuth, (req, res, next) => ctrl.deleteTransacao(req as AuthenticatedRequest, res, next));
};

