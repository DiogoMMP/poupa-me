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
 *           example: 01
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
 *         reembolso:
 *           type: string
 *           nullable: true
 *         userId:
 *           type: string
 *           description: Domain id of the owning user
 *     TransacaoInput:
 *       type: object
 *       required: [data, descricao, valor, categoriaId]
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         categoriaId:
 *           type: string
 *      # userId will be set by the server from the authenticated user; clients SHOULD NOT provide it.
 *     TransacaoReembolsoInput:
 *       type: object
 *       required: [data, descricao, valor, categoriaId, reembolso]
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/IData'
 *         descricao:
 *           type: string
 *         valor:
 *           $ref: '#/components/schemas/IDinheiroProps'
 *         categoriaId:
 *           type: string
 *         reembolso:
 *           type: string
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
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/saida', isAuth, (req, res, next) => ctrl.createSaida(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/reembolso:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Reembolso transaction
   *     description: Creates a new Reembolso linked to an existing transaction. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoReembolsoInput'
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/reembolso', isAuth, (req, res, next) => ctrl.createReembolso(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/credito:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Crédito transaction
   *     description: Creates a new Crédito transaction. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoInput'
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/credito', isAuth, (req, res, next) => ctrl.createCredito(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/despesa-mensal:
   *   post:
   *     tags:
   *       - Transacao
   *     summary: Create a Despesa Mensal transaction
   *     description: Creates a new monthly expense (Despesa Mensal). Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransacaoInput'
   *     responses:
   *       201:
   *         description: Transacao created
   */
  route.post('/despesa-mensal', isAuth, (req, res, next) => ctrl.createDespesaMensal(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get all transactions
   *     description: Returns list of transactions. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transacao'
   */
  route.get('/', isAuth, (req, res, next) => ctrl.getAllTransacoes(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/by-categoria:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get transactions by category
   *     description: Returns transactions in a category. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: categoriaId
   *         required: true
   *         schema:
   *           type: string
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
  route.get('/by-categoria', isAuth, (req, res, next) => ctrl.getTransacaoByCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/by-tipo:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get transactions by tipo
   *     description: Returns transactions filtered by tipo. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tipo
   *         required: true
   *         schema:
   *           type: string
   *           enum: ["Entrada","Saída","Crédito","Reembolso","Despesa Mensal"]
   *     responses:
   *       200:
   *         description: Matching transactions
   */
  route.get('/by-tipo', isAuth, (req, res, next) => ctrl.getTransacaoByTipo(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/by-status:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get transactions by status
   *     description: Returns transactions filtered by status. Requires authentication.
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
   */
  route.get('/by-status', isAuth, (req, res, next) => ctrl.getTransacaoByStatus(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /transacao/by-date-range:
   *   get:
   *     tags:
   *       - Transacao
   *     summary: Get transactions by date range
   *     description: |-
   *       Returns transactions within a date range. Requires authentication.
   *       Query params: start & end (ISO date strings) or from & to.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: start
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: end
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Matching transactions
   */
  route.get('/by-date-range', isAuth, (req, res, next) => ctrl.getTransacaoByDateRange(req as AuthenticatedRequest, res, next));

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

