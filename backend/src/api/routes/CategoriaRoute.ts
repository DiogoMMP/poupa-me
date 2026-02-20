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
   * /categoria/{id}:
   *   put:
   *     tags:
   *       - Categoria
   *     summary: Update a categoria
   *     description: Update categoria fields by ID. Admin only.
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
   *       404:
   *         description: Categoria not found
   */
  route.put('/:id', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.updateCategoria(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /categoria/{id}:
   *   delete:
   *     tags:
   *       - Categoria
   *     summary: Delete a categoria by ID
   *     description: Removes a categoria identified by its domain ID. Admin only.
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
   *         description: Deletion successful
   *       400:
   *         description: Deletion failed
   *       404:
   *         description: Categoria not found
   */
  route.delete('/:id', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.deleteCategoriaByDomainId(req as AuthenticatedRequest, res, next));
};
