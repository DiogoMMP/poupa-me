import type {NextFunction, Request, Response} from "express";

/**
 * Controller interface for User operations
 */
export default interface IUserController {

    /**
     * Registers a new user
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    registerUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Logs in a user
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    login(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets a user by their domain ID
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    getUserByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets a user by their email
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    getUserByEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Gets all users
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    getAllUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Updates a user by their domain ID
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Deletes a user by their domain ID
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    deleteUserByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}