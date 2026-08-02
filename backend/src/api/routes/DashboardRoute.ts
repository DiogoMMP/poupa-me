import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import BancoController from '../../controllers/Banco/BancoController.js';

const route = Router();

export default (app: Router) => {
  app.use('/dashboard', route);

  const ctrl = Container.get(BancoController);

  /**
   * @openapi
   * /dashboard/{bancoId}:
   *   get:
   *     tags:
   *       - Dashboard
   *     summary: Get dashboard for a specific bank
   *     description: Returns aggregated financial data for a specific bank including total balance breakdown. Also triggers background processing of pending recurring expenses.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bancoId
   *         required: true
   *         schema:
   *           type: string
   *         description: Banco domain ID
   *         example: "BNC00000000001"
   *     responses:
   *       200:
   *         description: Dashboard data for the specific bank
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 saldoGlobal:
   *                   type: number
   *                   description: Total for this bank (contas + cartoes)
   *                   example: 5000.50
   *                 detalhePorBanco:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "BNC00000000001"
   *                       nome:
   *                         type: string
   *                         example: "Millennium BCP"
   *                       icon:
   *                         type: string
   *                         example: "millennium.png"
   *                       saldoContas:
   *                         type: number
   *                         description: Total real money in accounts
   *                         example: 3000.00
   *                       saldoCartoes:
   *                         type: number
   *                         description: Total provisions in credit cards
   *                         example: 2000.50
   *                       totalBanco:
   *                         type: number
   *                         description: saldoContas + saldoCartoes
   *                         example: 5000.50
   *       404:
   *         description: Banco not found
   *       401:
   *         description: Unauthorized
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getDashboard(req, res, next));
};
