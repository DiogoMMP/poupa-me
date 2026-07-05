import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import DespesaRecorrenteController from '../../../controllers/DespesaRecorrente/DespesaRecorrenteController.js';

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
   *           description: Day of month (1-31), required for Despesa Mensal, Poupança, and Despesa Anual
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
   *           description: Savings account (required for Poupança)
   *         tipo:
   *           type: string
   *           enum: ["Despesa Mensal", "Despesa Semanal", "Despesa Anual", "Poupança"]
   *           example: "Despesa Mensal"
   *         ultimoProcessamento:
   *           type: string
   *           format: date
   *           nullable: true
   *         ativo:
   *           type: boolean
   *         imediata:
   *           type: boolean
   *           description: If true, first transaction is created immediately as "Concluído"
   *         diaDaSemana:
   *           type: number
   *           minimum: 1
   *           maximum: 7
   *           description: Day of week (1=Monday, 7=Sunday), required for Despesa Semanal
   *         mes:
   *           type: number
   *           minimum: 1
   *           maximum: 12
   *           description: Month (1-12), required for Despesa Anual
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
   *           description: Required for Despesa Mensal/Poupança (with diaDoMes), Despesa Semanal (with diaDaSemana), and Despesa Anual (with diaDoMes and mes)
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *           example: 15
   *           description: Required together with valor for Despesa Mensal, Poupança, and Despesa Anual
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
   *           enum: ["Despesa Mensal", "Despesa Semanal", "Despesa Anual", "Poupança"]
   *           default: Despesa Mensal
   *           example: "Despesa Mensal"
   *         ativo:
   *           type: boolean
   *           default: true
   *         imediata:
   *           type: boolean
   *           default: false
   *           description: If true, first transaction is created immediately as "Concluído"
   *         diaDaSemana:
   *           type: number
   *           minimum: 1
   *           maximum: 7
   *           description: Required with valor for Despesa Semanal (1=Monday, 7=Sunday)
   *         mes:
   *           type: number
   *           minimum: 1
   *           maximum: 12
   *           description: Required with valor and diaDoMes for Despesa Anual (1-12)
   *     DespesaRecorrenteUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         valor:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *           description: Required together with diaDoMes (or diaDaSemana/mes depending on tipo)
   *         diaDoMes:
   *           type: number
   *           minimum: 1
   *           maximum: 31
   *           description: Required together with valor for Despesa Mensal, Poupança, and Despesa Anual
   *         categoriaId:
   *           type: string
   *         contaOrigemId:
   *           type: string
   *         contaDestinoId:
   *           type: string
   *         contaPoupancaId:
   *           type: string
   *         tipo:
   *           type: string
   *           enum: ["Despesa Mensal", "Despesa Semanal", "Despesa Anual", "Poupança"]
   *         ativo:
   *           type: boolean
   *         imediata:
   *           type: boolean
   *         diaDaSemana:
   *           type: number
   *           minimum: 1
   *           maximum: 7
   *         mes:
   *           type: number
   *           minimum: 1
   *           maximum: 12
   */

  /**
   * @openapi
   * /despesa-recorrente:
   *   post:
   *     tags:
   *       - Despesa Recorrente - Regras
   *     summary: Create a new recurring expense
   *     description: |
   *       Creates a recurring expense (e.g., Netflix, Spotify). The system will auto-generate transactions based on the tipo:
   *       - **Despesa Mensal**: requires `valor` and `diaDoMes` (1-31)
   *       - **Despesa Semanal**: requires `valor` and `diaDaSemana` (1-7, Monday=1)
   *       - **Despesa Anual**: requires `valor`, `diaDoMes` (1-31), and `mes` (1-12)
   *       - **Poupança**: requires `valor`, `diaDoMes`, and `contaPoupancaId`
   *       
   *       Set `imediata: true` to create the first transaction immediately as "Concluído".
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DespesaRecorrenteInput'
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
   *       - Despesa Recorrente - Regras
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
   *       - Despesa Recorrente - Regras
   *     summary: Get scheduled recurring expenses for a bank
   *     description: Returns recurring expenses that have both valor and diaDoMes configured, whose origin account belongs to the given bank
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Optional bank domain ID to filter by
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
   *       401:
   *         description: Unauthorized
   * */
  route.get('/com-valor', isAuth, (req, res, next) => ctrl.getDespesasComValor(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/sem-valor:
   *   get:
   *     tags:
   *       - Despesa Recorrente - Regras
   *     summary: Get unscheduled recurring expenses
   *     description: Returns recurring expenses that have no valor or scheduling configured (icon/nome only), optionally filtered by bank and/or tipo
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bancoId
   *         required: false
   *         schema:
   *           type: string
   *         description: Optional bank domain ID to filter by
   *         example: "BNC00000000001"
   *       - in: query
   *         name: tipo
   *         required: false
   *         schema:
   *           type: string
   *           enum: ["Despesa Mensal", "Despesa Semanal", "Despesa Anual", "Poupança"]
   *         description: Optional tipo to filter by
   *         example: "Despesa Semanal"
   *     responses:
   *       200:
   *         description: List of unscheduled recurring expenses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DespesaRecorrente'
   *       400:
   *         description: Invalid parameters
   *       401:
   *         description: Unauthorized
   * */
  route.get('/sem-valor', isAuth, (req, res, next) => ctrl.getDespesasSemValor(req, res, next));

  /**
   * @openapi
   * /despesa-recorrente/{id}:
   *   get:
   *     tags:
   *       - Despesa Recorrente - Regras
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
   *       - Despesa Recorrente - Regras
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
   *       - Despesa Recorrente - Regras
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
