import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth } from '../middlewares/index.js';
import type IIACategorizacaoController from '../../controllers/IControllers/IIACategorizacaoController.js';

const route = Router();

export default (app: Router) => {
    app.use('/ia-categorizacao', route);

    const ctrl = Container.get('IACategorizacaoController') as IIACategorizacaoController;

    /**
     * @openapi
     * /ia-categorizacao/sugerir:
     *   get:
     *     tags:
     *       - IA Categorizacao
     *     summary: Sugere uma categoria para a descrição de uma transação
     *     description: Utiliza IA para sugerir uma categoria para a descrição fornecida, com base nas categorias existentes. Requer autenticação.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: description
     *         schema:
     *           type: string
     *         required: true
     *         description: A descrição da transação
     *     responses:
     *       200:
     *         description: Categoria sugerida com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                 nome:
     *                   type: string
     *                 icon:
     *                   type: string
     *       400:
     *         description: Pedido inválido - Descrição em falta
     *       500:
     *         description: Erro interno do servidor
     */
    route.get(
        '/sugerir',
        isAuth,
        (req, res, next) => ctrl.sugerirCategoria(req, res, next)
    );
};
