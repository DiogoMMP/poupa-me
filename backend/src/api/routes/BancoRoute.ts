import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import BancoController from '../../controllers/Banco/BancoController.js';

const route = Router();

export default (app: Router) => {
  app.use('/banco', route);

  const ctrl = Container.get(BancoController);

  /**
   * @openapi
   * components:
   *   schemas:
   *     BancoSummary:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           example: "BNC00000000001"
   *         user:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: "USR00000000001"
   *             nome:
   *               type: string
   *               example: "Diogo Silva"
   *         nome:
   *           type: string
   *           example: "Santander"
   *         icon:
   *           type: string
   *           example: "😊"
   *     Banco:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           example: "BNC00000000001"
   *         user:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: "USR00000000001"
   *             nome:
   *               type: string
   *               example: "Diogo Silva"
   *         nome:
   *           type: string
   *           example: "Santander"
   *         icon:
   *           type: string
   *           example: "😊"
   *         contasCartoesSelecionados:
   *           type: array
   *           items:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 example: "CNT00000000001"
   *               nome:
   *                 type: string
   *                 example: "Saldo Real"
   *               icon:
   *                 type: string
   *                 example: "😍"
   *     BancoInput:
   *       type: object
   *       required: [nome, icon]
   *       properties:
   *         nome:
   *           type: string
   *           example: "Millennium BCP"
   *         icon:
   *           type: string
   *           example: "millennium.png"
   *     BancoUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *           example: "Novo Banco"
   *         icon:
   *           type: string
   *           example: "novo_banco.png"
   *         contasCartoesSelecionados:
   *           type: array
   *           items:
   *             type: string
   *           description: IDs of selected contas/cartoes for dashboard calculation
   *           example: ["CNT00000000001", "CRT00000000001"]
   */

  /**
   * @openapi
   * /banco:
   *   post:
   *     tags:
   *       - Banco
   *     summary: Create a new banco
   *     description: Creates a new banco. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BancoInput'
   *     responses:
   *       201:
   *         description: Banco created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Banco'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   */
  route.post('/', isAuth, (req, res, next) => ctrl.createBanco(req, res, next));



  /**
   * @openapi
   * /banco:
   *   get:
   *     tags:
   *       - Banco
   *     summary: Get all bancos for authenticated user
   *     description: Returns all bancos belonging to the authenticated user (summary format without contasCartoesSelecionados)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of bancos
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BancoSummary'
   *       401:
   *         description: Unauthorized
   */
  route.get('/', isAuth, (req, res, next) => ctrl.getAllBancos(req, res, next));

  /**
   * @openapi
   * /banco/{id}:
   *   get:
   *     tags:
   *       - Banco
   *     summary: Get a banco by ID
   *     description: Returns a single banco by its domain ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Banco domain ID
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: Banco details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Banco'
   *       404:
   *         description: Banco not found
   *       401:
   *         description: Unauthorized
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getBanco(req, res, next));

  /**
   * @openapi
   * /banco/{id}:
   *   patch:
   *     tags:
   *       - Banco
   *     summary: Update a banco
   *     description: Updates an existing banco
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Banco domain ID
   *         example: "BNC00000000001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BancoUpdate'
   *     responses:
   *       200:
   *         description: Banco updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Banco'
   *       404:
   *         description: Banco not found
   *       401:
   *         description: Unauthorized
   */
  route.patch('/:id', isAuth, (req, res, next) => ctrl.updateBanco(req, res, next));

  /**
   * @openapi
   * /banco/{id}:
   *   delete:
   *     tags:
   *       - Banco
   *     summary: Delete a banco
   *     description: Deletes a banco by its domain ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Banco domain ID
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: Banco deleted successfully
   *       404:
   *         description: Banco not found
   *       401:
   *         description: Unauthorized
   */
  route.delete('/:id', isAuth, (req, res, next) => ctrl.deleteBanco(req, res, next));
};