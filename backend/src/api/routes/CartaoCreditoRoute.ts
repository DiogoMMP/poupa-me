import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import CartaoCreditoController from '../../controllers/CartaoCreditoController.js';

const route = Router();

export default (app: Router) => {
  app.use('/cartao', route);

  const ctrl = Container.get(CartaoCreditoController);

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
   *     Periodo:
   *       type: object
   *       properties:
   *         inicio:
   *           type: object
   *           properties:
   *             dia:
   *               type: number
   *             mes:
   *               type: number
   *             ano:
   *               type: number
   *         fecho:
   *           type: object
   *           properties:
   *             dia:
   *               type: number
   *             mes:
   *               type: number
   *             ano:
   *               type: number
   *       example:
   *         inicio:
   *           dia: 15
   *           mes: 2
   *           ano: 2026
   *         fecho:
   *           dia: 15
   *           mes: 3
   *           ano: 2026
   *     CartaoCredito:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         userId:
   *           type: string
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         limiteCredito:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         saldoUtilizado:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         periodo:
   *           $ref: '#/components/schemas/Periodo'
   *         contaPagamentoId:
   *           type: string
   *     CartaoCreditoInput:
   *       type: object
   *       required: [nome, icon, limiteCredito, periodo, contaPagamentoId]
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         limiteCredito:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         saldoUtilizado:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         periodo:
   *           $ref: '#/components/schemas/Periodo'
   *       example:
   *         nome: "Cartão Exemplo"
   *         icon: "visa"
   *         limiteCredito:
   *           valor: 1000
   *           moeda: EUR
   *         periodo:
   *           inicio:
   *             dia: 15
   *             mes: 2
   *             ano: 2026
   *           fecho:
   *             dia: 15
   *             mes: 3
   *             ano: 2026
   *         contaPagamentoId:
   *           type: string
   *     CartaoCreditoUpdate:
   *       type: object
   *       properties:
   *         nome:
   *           type: string
   *         icon:
   *           type: string
   *         limiteCredito:
   *           $ref: '#/components/schemas/IDinheiroProps'
   *         periodo:
   *           $ref: '#/components/schemas/Periodo'
   *         contaPagamentoId:
   *           type: string
   */

  /**
   * @openapi
   * /cartao:
   *   post:
   *     tags:
   *       - CartaoCredito
   *     summary: Create a new cartao
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CartaoCreditoInput'
   *     responses:
   *       201:
   *         description: Cartao created
   */
  route.post('/', isAuth, (req, res, next) => ctrl.createCartao(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /cartao/{id}:
   *   patch:
   *     tags:
   *       - CartaoCredito
   *     summary: Update a cartao (partial)
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
   *             $ref: '#/components/schemas/CartaoCreditoUpdate'
   *     responses:
   *       200:
   *         description: Updated cartao
   */
  route.patch('/:id', isAuth, (req, res, next) => ctrl.updateCartao(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /cartao/{id}:
   *   delete:
   *     tags:
   *       - CartaoCredito
   *     summary: Delete a cartao by domain id
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
   */
  route.delete('/:id', isAuth, (req, res, next) => ctrl.deleteCartaoByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /cartao/{id}:
   *   get:
   *     tags:
   *       - CartaoCredito
   *     summary: Get a cartao by domain id
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
   *         description: Cartao found
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getCartaoByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /cartao:
   *   get:
   *     tags:
   *       - CartaoCredito
   *     summary: Get all cartoes
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of cartoes
   */
  route.get('/', isAuth, (req, res, next) => ctrl.getAllCartoes(req as AuthenticatedRequest, res, next));
};

