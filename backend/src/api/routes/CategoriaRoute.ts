import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth, authorize, Role } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import CategoriaController from '../../controllers/CategoriaController.js';

const route = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "CAT-2026-00001"
 *         nome:
 *           type: string
 *           example: "Groceries"
 *         icon:
 *           type: string
 *           example: "shopping-cart"
 *     CategoriaInput:
 *       type: object
 *       required: [nome, icon]
 *       properties:
 *         nome:
 *           type: string
 *         icon:
 *           type: string
 */
export default (app: Router) => {
  app.use('/categoria', route);

  const ctrl = Container.get(CategoriaController);

  /**
   * @openapi
   * /categoria:
   *   post:
   *     tags:
   *       - Categoria
   *     summary: Create a new categoria
   *     description: Creates a new categoria. Admin only.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CategoriaInput'
   *     responses:
   *       201:
   *         description: Categoria created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Categoria'
   *       400:
   *         description: Validation failed
   */
  route.post('/', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.createCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria:
   *   get:
   *     tags:
   *       - Categoria
   *     summary: Get all categorias
   *     description: Returns list of categorias. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of categorias
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Categoria'
   */
  route.get('/', isAuth, (req, res, next) => ctrl.getAllCategorias(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria/by-nome:
   *   get:
   *     tags:
   *       - Categoria
   *     summary: Get categoria by name
   *     description: Search categoria by name. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: nome
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Matching categorias
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Categoria'
   */
  route.get('/by-nome', isAuth, (req, res, next) => ctrl.getCategoriaByNome(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria/{id}:
   *   get:
   *     tags:
   *       - Categoria
   *     summary: Get categoria by ID
   *     description: Returns a single categoria by domain ID. Requires authentication.
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
   *         description: The categoria
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Categoria'
   *       404:
   *         description: Not found
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getCategoriaByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria/{nome}:
   *   put:
   *     tags:
   *       - Categoria
   *     summary: Update a categoria
   *     description: Update categoria fields. Admin only. The category to update is identified by the `nome` path parameter.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: nome
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CategoriaInput'
   *     responses:
   *       200:
   *         description: Updated categoria
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Categoria'
   *       400:
   *         description: Validation or update error
   */
  route.put('/:nome', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.updateCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria/{nome}:
   *   delete:
   *     tags:
   *       - Categoria
   *     summary: Delete a categoria by name
   *     description: Removes a categoria identified by its name. Admin only.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: nome
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Deletion successful
   *       400:
   *         description: Deletion failed
   */
  route.delete('/:nome', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.deleteCategoriaByDomainId(req as AuthenticatedRequest, res, next));
};

