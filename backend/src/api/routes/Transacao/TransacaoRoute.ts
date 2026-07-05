import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import type { AuthenticatedRequest } from '../../middlewares/index.js';
import TransacaoController from '../../../controllers/Transacao/TransacaoController.js';

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
   *       - Transação
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
   *       - Transação
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
   *       - Transação
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
   *       - Transação
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
   *       - Transação
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
   *       - Transação
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
   *       - Transação - Despesas Recorrentes
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
   *       - Transação - Despesas Recorrentes
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
   *       - Transação - Despesas Recorrentes
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
   *       - Transação - Despesas Recorrentes
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

  /**
   * @openapi
   * /transacao/despesa-recorrente:
   *   get:
   *     tags:
   *       - Transação - Despesas Recorrentes
   *     summary: Get recurring expense transactions with optional filters
   *     description: |
   *       Returns recurring expense transactions (Despesa Mensal, Despesa Semanal, Despesa Anual, Poupança)
   *       for the authenticated user. Optional filters can be applied via query parameters. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Domain ID of the Banco to filter by
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
   *     responses:
   *       200:
   *         description: List of recurring expense transactions matching the criteria
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/despesa-recorrente', isAuth, (req, res, next) => ctrl.getDespesaRecorrente(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/{id}:
   *   get:
   *     tags:
   *       - Transação
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
   *       - Transação
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
   *       - Transação
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

