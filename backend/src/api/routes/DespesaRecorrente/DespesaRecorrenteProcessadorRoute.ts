import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../../middlewares/index.js';
import DespesaRecorrenteProcessadorController from '../../../controllers/DespesaRecorrente/DespesaRecorrenteProcessadorController.js';

const route = Router();

export default (app: Router) => {
  app.use('/despesa-recorrente', route);

  const ctrl = Container.get(DespesaRecorrenteProcessadorController);

  /**
   * @openapi
   * /despesa-recorrente/{id}/gerar-transacao:
   *   post:
   *     tags:
   *       - Despesa Recorrente - Processador
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
};
