import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type IUserController from './IControllers/IUserController.js';
import type IUserService from '../services/IServices/IUserService.js';
import type { IUserRegistrationDTO, IUserLoginDTO, IUserUpdateDTO, IUserChangeRoleDTO } from '../dto/IUserDTO.js';

/**
 * AuthController handles user-related HTTP requests such as registration, login, and user management.
 * It uses IUserService to perform business logic and interacts with the request and response objects.
 */
@Service()
export default class AuthController implements IUserController {
    constructor(
        @Inject('AuthService') private authService: IUserService
    ) {}

    /**
     * Registers a new user with the provided registration data. Validates input and returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object containing user registration data in the body.
     * @param res - Express response object used to send back the result of the registration process.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async registerUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as IUserRegistrationDTO;
            const result = await this.authService.registerUser(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Logs in a user with the provided credentials and creates a session.
     * @param req - Express request object containing user login data in the body.
     * @param res - Express response object used to send back the result of the login process.
     * @param next - Express next function for error handling.
     */
    public async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as IUserLoginDTO;
            const result = await this.authService.login(inputDTO);
            if (result.isFailure) return res.status(401).json({ error: result.error });

            const { token, user } = result.getValue();

            // Store user in session
            req.session.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };

            return res.status(200).json({ token, user });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Gets the current logged-in user from the session.
     * @param req - Express request object with session data.
     * @param res - Express response object.
     * @param next - Express next function for error handling.
     */
    public async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            if (!req.session.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Return user from session
            return res.status(200).json({
                id: req.session.user.id,
                name: req.session.user.name,
                role: req.session.user.role,
                locale: 'pt'
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Logs out the current user by destroying the session.
     * @param req - Express request object with session data.
     * @param res - Express response object.
     * @param next - Express next function for error handling.
     */
    public async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            req.session.destroy((err: Error | null) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to logout' });
                }
                res.clearCookie('connect.sid'); // clear session cookie
                return res.status(200).json({ success: true });
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Retrieves a user by their domain ID. Validates the ID parameter and returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object containing the user ID in the route parameters.
     * @param res - Express response object used to send back the user data or an error message.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async getUserByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const result = await this.authService.getUserByDomainId(id);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Retrieves a user by their email address. Validates the email parameter and returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object containing the email in the query parameters or route parameters.
     * @param res - Express response object used to send back the user data or an error message.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async getUserByEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let email = (req.query.email || req.params.email) as string;
            if (email) email = decodeURIComponent(String(email)).trim();
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const result = await this.authService.getUserByEmail(email);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Retrieves all users from the system. Returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object, not used in this method but included for consistency with other controller methods.
     * @param res - Express response object used to send back the list of users or an error message.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await this.authService.getAllUsers();
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Updates a user's information based on the provided update data. Validates input and returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object containing user update data in the body.
     * @param res - Express response object used to send back the updated user data or an error message.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let email = (req.params.email || req.query.email) as string;
            if (email) email = decodeURIComponent(String(email)).trim();
            const inputDTO = req.body as IUserUpdateDTO;
            if (!email) return res.status(400).json({ error: 'Email is required to locate user' });

            const result = await this.authService.updateUser(inputDTO, email);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Changes the role of a user identified by email.
     */
    public async changeRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let email = (req.params.email || req.query.email) as string;
            if (email) email = decodeURIComponent(String(email)).trim();
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const dto = req.body as IUserChangeRoleDTO;
            if (!dto?.role) return res.status(400).json({ error: 'Role is required' });

            const result = await this.authService.changeRole(email, dto);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Deletes a user based on their email address. Validates the email parameter and returns appropriate HTTP responses based on success or failure.
     * @param req - Express request object containing the email in the query parameters or route parameters.
     * @param res - Express response object used to send back a success message or an error message.
     * @param next - Express next function for error handling. If an error occurs, it will be passed to the next middleware.
     */
    public async deleteUserByEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const email = (req.params.email || req.query.email) as string;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const result = await this.authService.deleteUserByEmail(email);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) {
            next(e);
        }
    }
}
