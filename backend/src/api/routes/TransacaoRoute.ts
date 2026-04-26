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
   * /transacao/poupanca:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Poupança (savings) recurring transaction
   *     description: |
   *       Creates a recurring savings transfer transaction with status "Pendente" or "Concluído" (if imediata=true).
   *       Requires `contaDestinoId` for the destination account and `contaPoupancaId` for the savings account.
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
   *             descricao: "Transfer to savings"
   *             valor:
   *               valor: 200.00
   *               moeda: "EUR"
   *             categoriaId: "CAT00000000001"
   *             contaId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             contaPoupancaId: "CNT00000000003"
   *             imediata: true
   *     responses:
   *       201:
   *         description: Poupança created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transacao'
   *       400:
   *         description: Validation failed
   */
  route.post('/poupanca', isAuth, (req, res, next) => ctrl.createPoupanca(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/poupanca/concluir/{id}:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Conclude a Poupança transaction
   *     description: |-
   *       Concludes a savings transfer by changing status from "Pendente" to "Concluído"
   *       and adding the amount to the savings account (contaPoupanca).
   *       Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Poupança transaction
   *     responses:
   *       200:
   *         description: Poupança concluded successfully
   *       400:
   *         description: Invalid transaction or already concluded
   */
  route.post('/poupanca/concluir/:id', isAuth, (req, res, next) => ctrl.concluirPoupanca(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/despesa-mensal:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Despesa Mensal recurring transaction
   *     description: |
   *       Creates a recurring monthly expense transaction with status "Pendente" or "Concluído" (if imediata=true).
   *       Requires `contaDestinoId` for the destination account.
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
   *               dia: 15
   *               mes: 5
   *               ano: 2026
   *             descricao: "Netflix"
   *             valor:
   *               valor: 15.99
   *               moeda: EUR
   *             categoriaId: "CAT00000000001"
   *             contaId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             imediata: true
   *     responses:
   *       201:
   *         description: Recurring monthly expense created
   */
  route.post('/despesa-recorrente/despesa-mensal', isAuth, (req, res, next) => ctrl.createDespesaMensal(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/despesa-semanal:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Despesa Semanal recurring transaction
   *     description: |
   *       Creates a recurring weekly expense transaction with status "Pendente" or "Concluído" (if imediata=true).
   *       Requires `contaDestinoId` for the destination account.
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
   *               dia: 24
   *               mes: 4
   *               ano: 2026
   *             descricao: "Ginásio"
   *             valor:
   *               valor: 10.00
   *               moeda: EUR
   *             categoriaId: "CAT00000000002"
   *             contaId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             imediata: true
   *     responses:
   *       201:
   *         description: Recurring weekly expense created
   */
  route.post('/despesa-recorrente/despesa-semanal', isAuth, (req, res, next) => ctrl.createDespesaSemanal(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/despesa-anual:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Despesa Anual recurring transaction
   *     description: |
   *       Creates a recurring annual expense transaction with status "Pendente" or "Concluído" (if imediata=true).
   *       Requires `contaDestinoId` for the destination account.
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
   *               dia: 1
   *               mes: 6
   *               ano: 2026
   *             descricao: "Seguro Automóvel"
   *             valor:
   *               valor: 350.00
   *               moeda: EUR
   *             categoriaId: "CAT00000000003"
   *             contaId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             imediata: true
   *     responses:
   *       201:
   *         description: Recurring annual expense created
   */
  route.post('/despesa-recorrente/despesa-anual', isAuth, (req, res, next) => ctrl.createDespesaAnual(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/concluir/{id}:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Conclude a recurring expense transaction
   *     description: |
   *       Concludes a recurring expense by changing status from "Pendente" to "Concluído"
   *       and subtracting the amount from the destination account.
   *       Applies to Despesa Mensal, Despesa Semanal, Despesa Anual, and Poupança.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the recurring expense transaction
   *     responses:
   *       200:
   *         description: Recurring expense concluded successfully
   *       400:
   *         description: Invalid transaction or already concluded
   *       404:
   *         description: Transaction not found
   */
  route.post('/despesa-recorrente/concluir/:id', isAuth, (req, res, next) => ctrl.concluirDespesaRecorrente(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Get All by Type ---

  /**
   * @openapi
   * /transacao/all-conta:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/all-conta', isAuth, (req, res, next) => ctrl.getAllContaTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/all-cartao:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/all-cartao', isAuth, (req, res, next) => ctrl.getAllCartaoTransactions(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/all-banco:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/all-banco', isAuth, (req, res, next) => ctrl.getAllByBanco(req as AuthenticatedRequest, res, next));

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
   * /transacao/despesa-recorrente:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get all recurring expense transactions for a specific bank
   *     description: |
   *       Returns all recurring expense transactions (Despesa Mensal, Despesa Semanal, Despesa Anual, Poupança)
   *       for accounts belonging to the given bank. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco to filter transactions by
   *     responses:
   *       200:
   *         description: List of recurring expense transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/despesa-recorrente', isAuth, (req, res, next) => ctrl.getDespesaRecorrente(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Categoria ---

  /**
   * @openapi
   * /transacao/conta/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/conta/by-categoria', isAuth, (req, res, next) => ctrl.getContaTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/cartao/by-categoria', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get recurring expense transactions by category for a specific bank
   *     description: |
   *       Returns recurring expense transactions (Despesa Mensal, Despesa Semanal, Despesa Anual, Poupança)
   *       filtered by category for accounts belonging to the given bank. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco
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
  route.get('/despesa-recorrente/by-categoria', isAuth, (req, res, next) => ctrl.getDespesaRecorrenteByCategoria(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Status (one for cartão, one for despesa mensal) ---

  /**
   * @openapi
   * /transacao/cartao/by-status:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/cartao/by-status', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByStatus(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/by-status:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get recurring expense transactions by status for a specific bank
   *     description: |
   *       Returns recurring expense transactions (Despesa Mensal, Despesa Semanal, Despesa Anual, Poupança)
   *       filtered by status for accounts belonging to the given bank. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco
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
  route.get('/despesa-recorrente/by-status', isAuth, (req, res, next) => ctrl.getDespesaRecorrenteByStatus(req as AuthenticatedRequest, res, next));

  // --- GET Routes: Filter by Period (one per type) ---

  /**
   * @openapi
   * /transacao/conta/by-period:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/conta/by-period', isAuth, (req, res, next) => ctrl.getContaTransactionsByPeriod(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/cartao/by-period:
   *   get:
   *     tags:
   *       - Transacao
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
  route.get('/cartao/by-period', isAuth, (req, res, next) => ctrl.getCartaoTransactionsByPeriod(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-recorrente/by-period:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get recurring expense transactions by predefined period for a specific bank
   *     description: |
   *       Returns recurring expense transactions (Despesa Mensal, Despesa Semanal, Despesa Anual, Poupança)
   *       within a predefined period for accounts belonging to the given bank. Requires authentication.
   *       Valid periods: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco
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
  route.get('/despesa-recorrente/by-period', isAuth, (req, res, next) => ctrl.getDespesaRecorrenteByPeriod(req as AuthenticatedRequest, res, next));

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

