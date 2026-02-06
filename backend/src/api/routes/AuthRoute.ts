import { Router } from 'express';
import { Container } from 'typedi';
import { isAuth, authorize, Role } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import AuthController from '../../controllers/AuthController.js';

const route = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "USR-2026-00001"
 *           description: Domain identifier for the user (read-only)
 *         email:
 *           type: string
 *           example: "alice@example.com"
 *         name:
 *           type: string
 *           example: "Alice"
 *         role:
 *           type: string
 *           example: "User"
 *     UserRegistration:
 *       type: object
 *       required: [email, name, password]
 *       properties:
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           description: Optional role; defaults to 'User'
 *     UserLogin:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UserUpdate:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         password:
 *           type: string
 */

export default (app: Router) => {
  app.use('/auth', route);

  const ctrl = Container.get(AuthController);

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Register a new user
   *     description: Creates a new user account. Public endpoint.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserRegistration'
   *     responses:
   *       201:
   *         description: User created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation failed
   */
  route.post('/register', (req, res, next) => ctrl.registerUser(req, res, next));

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Login a user
   *     description: Authenticate and obtain a JWT token. Public endpoint.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserLogin'
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Invalid credentials
   */
  route.post('/login', (req, res, next) => ctrl.login(req, res, next));

  /**
   * @openapi
   * /auth:
   *   get:
   *     tags:
   *       - Auth
   *     summary: Get all users
   *     description: Returns list of users. Admin only.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  route.get('/', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.getAllUsers(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /auth/{id}:
   *   get:
   *     tags:
   *       - Auth
   *     summary: Get user by ID
   *     description: Returns a single user by domain ID. Requires authentication.
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
   *         description: The user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: Not found
   */
  route.get('/:id', isAuth, (req, res, next) => ctrl.getUserByDomainId(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /auth/by-email:
   *   get:
   *     tags:
   *       - Auth
   *     summary: Get user by email
   *     description: Search user by email. Admin only.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Matching users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   */
  route.get('/by-email', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.getUserByEmail(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /auth:
   *   put:
   *     tags:
   *       - Auth
   *     summary: Update a user
   *     description: Update user fields (name, password). The email in the body is used to identify the user and cannot be changed.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdate'
   *     responses:
   *       200:
   *         description: Updated user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation or update error
   */
  route.put('/', isAuth, (req, res, next) => ctrl.updateUser(req as AuthenticatedRequest, res, next));

  /**
   * @openapi
   * /auth/{id}:
   *   delete:
   *     tags:
   *       - Auth
   *     summary: Delete a user by ID
   *     description: Removes a user identified by domain ID. Admin only.
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
   */
  route.delete('/:id', isAuth, authorize([Role.Admin]), (req, res, next) => ctrl.deleteUserByDomainId(req as AuthenticatedRequest, res, next));
};
