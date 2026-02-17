import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import ContaController from '../../controllers/ContaController.js';

const route = Router();

export default (app: Router) => {
  app.use('/conta', route);

  const ctrl = Container.get(ContaController);

  /**
   * @openapi
   * components:
   *   schemas:
   *     IDinheiroProps:
   *       type: object
   *       properties:
   *         valor:
   *           type: number
   *           example: 100.50
   *         moeda:
   *           type: string
   *           example: EUR
   *     Conta:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           example: "CON-2026-00001"
   *         userId:
   *           type: string
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         saldo:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         transacoes:
   *           type: array
   *           items:
   *             type: object
   *     ContaInput:
   *       type: object
   *       required: [nome, icon]
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         saldo:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         bancoId:
   *           type: string
   *       example:
   *         nome: "Conta Ordenado"
   *         icon: "salary.png"
   *         saldo:
   *           valor: 1000
   *           moeda: EUR
   *         bancoId: "BNC00000000001"
   *     ContaUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   */

  /**
   * @openapi
   * /conta:
   *   post:
   *     tags:
   *       - Conta
   *     summary: Create a new conta
   *     description: Creates a new conta. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ContaInput'
   *     responses:
   *       201:
   *         description: Conta created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Conta'
   *       400:
   *         description: Validation failed
   */
  // Create conta
  route.post('/', isAuth, (req, res, next) => ctrl.createConta(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /conta/{id}:
   *   patch:
   *     tags:
   *       - Conta
   *     summary: Update a conta (partial)
   *     description: Apply partial changes to a conta. Uses PATCH semantics. Requires authentication.
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
   *             $ref: '#/components/schemas/ContaUpdate'
   *     responses:
   *       200:
   *         description: Updated conta
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Conta'
   *       400:
   *         description: Validation or update error
   */
  // Patch update conta
  route.patch('/:id', isAuth, (req, res, next) => ctrl.updateConta(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /conta/{id}:
   *   delete:
   *     tags:
   *       - Conta
   *     summary: Delete a conta by domain id
   *     description: Deletes a conta identified by its domain id. Requires authentication.
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
   *         description: Deletion result
   *       400:
   *         description: Validation failed
   */
  // Delete conta by domain id
  route.delete('/:id', isAuth, (req, res, next) => ctrl.deleteContaByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /conta/{id}:
   *   get:
   *     tags:
   *       - Conta
   *     summary: Get a conta by domain id
   *     description: Retrieves a conta by its domain id. Requires authentication.
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
   *         description: Conta found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Conta'
   *       404:
   *         description: Not found
   */
  // Get conta by domain id
  route.get('/:id', isAuth, (req, res, next) => ctrl.getContaByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /conta:
   *   get:
   *     tags:
   *       - Conta
   *     summary: Get all contas
   *     description: Returns list of contas for the authenticated user. Optionally filter by banco.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Optional banco domain ID to filter contas by banco
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: List of contas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Conta'
   */
  // Get all contas (optionally filtered by bancoId query param)
  route.get('/', isAuth, (req, res, next) => ctrl.getAllContas(req as AuthenticatedRequest, res, next));
};
