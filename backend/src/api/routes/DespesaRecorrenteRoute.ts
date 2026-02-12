import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import DespesaRecorrenteController from '../../controllers/DespesaRecorrenteController.js';

const route = Router();

export default (app: Router) => {
  app.use('/despesa-recorrente', route);

  const ctrl = Container.get(DespesaRecorrenteController);

  /**
   * @openapi
   * components:
   *   schemas:
   *     DespesaRecorrente:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           example: "DRC00000000001"
   *         userId:
   *           type: string
   *         nome:
   *           type: string
   *           example: "Netflix"
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         diaDoMes:
   *           type: number
   *           example: 15
   *         categoriaId:
   *           type: string
   *           example: "CAT00000000001"
   *         contaOrigemId:
   *           type: string
   *           example: "CNT00000000001"
   *           description: Conta de onde sai o dinheiro (saldo real)
   *         contaDestinoId:
   *           type: string
   *           example: "CNT00000000002"
   *           description: Conta de destino (despesas mensais)
   *         ultimoProcessamento:
   *           type: string
   *           format: date
   *           nullable: true
   *         ativo:
   *           type: boolean
   *     DespesaRecorrenteInput:
   *       type: object
   *       required: [nome, valor, diaDoMes, categoriaId, contaOrigemId, contaDestinoId]
   *       properties:
   *         nome:
   *           type: string
   *           example: "Netflix"
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *           example: 15
   *         categoriaId:
   *           type: string
   *           example: "CAT00000000001"
   *         contaOrigemId:
   *           type: string
   *           example: "CNT00000000001"
   *           description: Conta de onde sai o dinheiro (saldo real)
   *         contaDestinoId:
   *           type: string
   *           example: "CNT00000000002"
   *           description: Conta de destino (despesas mensais)
   *         ativo:
   *           type: boolean
   *           default: true
   *     DespesaRecorrenteUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *         categoriaId:
   *           type: string
   *         contaOrigemId:
   *           type: string
   *         contaDestinoId:
   *           type: string
   *         ativo:
   *           type: boolean
   */

  /**
   * @openapi
   * /despesa-recorrente:
   *   post:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Create a new recurring expense
   *     description: Creates a recurring monthly expense (e.g., Netflix, Spotify). The system will auto-generate transactions on the scheduled day each month.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DespesaRecorrenteInput'
   *           example:
   *             nome: "Netflix"
   *             valor:
   *               valor: 15.99
   *               moeda: EUR
   *             diaDoMes: 15
   *             categoriaId: "CAT00000000001"
   *             contaOrigemId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             ativo: true
   *     responses:
   *       201:
   *         description: Recurring expense created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DespesaRecorrente'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   */
  route.post('/', isAuth, (req, res, next) => ctrl.createDespesa(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente:
   *   get:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Get all recurring expenses for authenticated user
   *     description: Returns all recurring expenses belonging to the authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of recurring expenses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DespesaRecorrente'
   *       401:
   *         description: Unauthorized
   */
  route.get('/', isAuth, (req, res, next) => ctrl.getAllDespesas(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/{id}:
   *   get:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Get a recurring expense by ID
   *     description: Returns a single recurring expense by its domain ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: DespesaRecorrente domain ID
   *         example: "DRC00000000001"
   *     responses:
   *       200:
   *         description: Recurring expense details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DespesaRecorrente'
   *       404:
   *         description: Not found
   *       401:
   *         description: Unauthorized
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getDespesa(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/{id}:
   *   patch:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Update a recurring expense
   *     description: Updates an existing recurring expense
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: DespesaRecorrente domain ID
   *         example: "DRC00000000001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DespesaRecorrenteUpdate'
   *           example:
   *             nome: "Spotify Premium"
   *             valor:
   *               valor: 10.99
   *               moeda: EUR
   *             ativo: false
   *     responses:
   *       200:
   *         description: Recurring expense updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DespesaRecorrente'
   *       404:
   *         description: Not found
   *       401:
   *         description: Unauthorized
   */
  route.patch('/:id', isAuth, (req, res, next) => ctrl.updateDespesa(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/{id}:
   *   delete:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Delete a recurring expense
   *     description: Deletes a recurring expense by its domain ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: DespesaRecorrente domain ID
   *         example: "DRC00000000001"
   *     responses:
   *       200:
   *         description: Recurring expense deleted successfully
   *       404:
   *         description: Not found
   *       401:
   *         description: Unauthorized
   */
  route.delete('/:id', isAuth, (req, res, next) => ctrl.deleteDespesa(req, res, next));
};

