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
   *         icon:
   *           type: string
   *           example: "netflix"
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
   *           description: Account from which money leaves (real balance)
   *         contaDestinoId:
   *           type: string
   *           example: "CNT00000000002"
   *           description: Destination account (monthly expenses)
   *         tipo:
   *           type: string
   *           enum: [Despesa Mensal, Poupança]
   *           example: "Despesa Mensal"
   *         ultimoProcessamento:
   *           type: string
   *           format: date
   *           nullable: true
   *         ativo:
   *           type: boolean
   *     DespesaRecorrenteInput:
   *       type: object
   *       required: [nome, icon, categoriaId, contaOrigemId, contaDestinoId]
   *       properties:
   *         nome:
   *           type: string
   *           example: "Netflix"
   *         icon:
   *           type: string
   *           example: "netflix"
   *           description: Icon identifier (required)
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *           description: Required together with diaDoMes
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *           example: 15
   *           description: Required together with valor
   *         categoriaId:
   *           type: string
   *           example: "CAT00000000001"
   *         contaOrigemId:
   *           type: string
   *           example: "CNT00000000001"
   *           description: Account from which money leaves (real balance)
   *         contaDestinoId:
   *           type: string
   *           example: "CNT00000000002"
   *           description: Destination account (monthly expenses)
   *         contaPoupancaId:
   *           type: string
   *           example: "CNT00000000003"
   *           description: Required when tipo is Poupança
   *         tipo:
   *           type: string
   *           enum: [Despesa Mensal, Poupança]
   *           default: Despesa Mensal
   *           example: "Despesa Mensal"
   *         ativo:
   *           type: boolean
   *           default: true
   *     DespesaRecorrenteUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *           description: Required together with diaDoMes
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *           description: Required together with valor
   *         categoriaId:
   *           type: string
   *         contaOrigemId:
   *           type: string
   *         contaDestinoId:
   *           type: string
   *         tipo:
   *           type: string
   *           enum: [Despesa Mensal, Poupança]
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
   *             icon: "netflix"
   *             valor:
   *               valor: 15.99
   *               moeda: EUR
   *             diaDoMes: 15
   *             categoriaId: "CAT00000000001"
   *             contaOrigemId: "CNT00000000001"
   *             contaDestinoId: "CNT00000000002"
   *             tipo: "Despesa Mensal"
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
   * /despesa-recorrente/com-valor:
   *   get:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Get scheduled recurring expenses for a bank
   *     description: Returns recurring expenses that have both valor and diaDoMes configured, whose origin account belongs to the given bank
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Bank domain ID to filter by
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: List of scheduled recurring expenses for the bank
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DespesaRecorrente'
   *       400:
   *         description: bancoId is required
   *       401:
   *         description: Unauthorized
   */
  route.get('/com-valor', isAuth, (req, res, next) => ctrl.getDespesasComValor(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/sem-valor:
   *   get:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Get unscheduled recurring expenses for a bank
   *     description: Returns recurring expenses that have no valor or diaDoMes configured (icon/nome only), whose origin account belongs to the given bank
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Bank domain ID to filter by
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: List of unscheduled recurring expenses for the bank
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DespesaRecorrente'
   *       400:
   *         description: bancoId is required
   *       401:
   *         description: Unauthorized
   */
  route.get('/sem-valor', isAuth, (req, res, next) => ctrl.getDespesasSemValor(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/{id}/gerar-transacao:
   *   post:
   *     tags:
   *       - DespesaRecorrente
   *     summary: Manually generate a pending transaction for a sem-valor recurring expense
   *     description: >
   *       Creates a pending transaction using the provided valor and data for a recurring expense
   *       rule that has no valor/diaDoMes configured. The rule itself is NOT updated.
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
   *             type: object
   *             required: [valor, data]
   *             properties:
   *               valor:
   *                 $ref: '#/components/schemas/IDinheiroProps'
   *               data:
   *                 type: object
   *                 required: [dia, mes, ano]
   *                 properties:
   *                   dia:
   *                     type: number
   *                     minimum: 1
   *                     maximum: 31
   *                   mes:
   *                     type: number
   *                     minimum: 1
   *                     maximum: 12
   *                   ano:
   *                     type: number
   *                     example: 2026
   *           example:
   *             valor:
   *               valor: 9.99
   *               moeda: EUR
   *             data:
   *               dia: 15
   *               mes: 2
   *               ano: 2026
   *     responses:
   *       201:
   *         description: Pending transaction created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transacao'
   *       400:
   *         description: Missing or invalid fields
   *       403:
   *         description: Unauthorized
   *       404:
   *         description: Recurring expense not found
   */
  route.post('/:id/gerar-transacao', isAuth, (req, res, next) => ctrl.gerarTransacaoSemValor(req, res, next));

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
