import type { Request, Response, NextFunction } from 'express';

export interface ICartaoCreditoController {

    /**
     * Handles the creation of a new CartaoCredito. Expects a request body containing the necessary fields to create a
     * CartaoCredito, such as userId, nome, limite, and vencimento.
     * @param req - The Express request object, which should contain the CartaoCredito data in the body. The userId can
     * be provided in the body or inferred from the authenticated user.
     * @param res - The Express response object, used to send back the created CartaoCredito or an error message if creation fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during creation, it should be passed to this function.
     */
    createCartao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Handles the update of an existing CartaoCredito. Expects a request containing the ID of the CartaoCredito to
     * update (either in the URL parameters or query) and a request body with the fields to update (such as nome, limite, or vencimento).
     * @param req - The Express request object, which should contain the ID of the CartaoCredito to update (in params or query) and the update data in the body.
     * @param res - The Express response object, used to send back the updated CartaoCredito or an error message if the update fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during the update, it should be passed to this function.
     */
    updateCartao(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Handles the deletion of a CartaoCredito by its domain ID. Expects a request containing the ID of the
     * CartaoCredito to delete (either in the URL parameters or query).
     * @param req - The Express request object, which should contain the ID of the CartaoCredito to delete (in params or query).
     * @param res - The Express response object, used to send back a success message if deletion is successful or an error message if it fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during deletion, it should be passed to this function.
     */
    deleteCartaoByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Handles the retrieval of a CartaoCredito by its domain ID. Expects a request containing the ID of the
     * CartaoCredito to retrieve (either in the URL parameters or query).
     * @param req - The Express request object, which should contain the ID of the CartaoCredito to retrieve (in params or query).
     * @param res - The Express response object, used to send back the retrieved CartaoCredito or an error message if retrieval fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during retrieval, it should be passed to this function.
     */
    getCartaoByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Handles the retrieval of all CartaoCredito entities for the authenticated user. Expects the user to be
     * authenticated and their ID to be available in the request (either in the body or inferred from the authenticated user).
     * @param req - The Express request object, which should contain the authenticated user's ID (either in the body or inferred from the authentication context).
     * @param res - The Express response object, used to send back the list of CartaoCredito entities for the user or
     * an error message if retrieval fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during retrieval, it should be passed to this function.
     */
    getAllCartoes(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Handles the retrieval of the extrato (transaction history) for a specific CartaoCredito. Expects a request
     * containing the ID of the CartaoCredito to retrieve the extrato for (either in the URL parameters or query) and
     * the authenticated user's ID (either in the body or inferred from authentication).
     * @param req - The Express request object, which should contain the ID of the CartaoCredito to retrieve the extrato
     * for (in params or query) and the authenticated user's ID (in body or inferred from authentication).
     * @param res - The Express response object, used to send back the extrato (list of transactions and current balance)
     * for the specified CartaoCredito or an error message if retrieval fails.
     * @param next - The next middleware function in the Express pipeline, used for error handling. If an error occurs
     * during retrieval of the extrato, it should be passed to this function.
     */
    getExtrato(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
