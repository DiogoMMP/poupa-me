import type {Request, Response, NextFunction} from 'express';
import {type AuthenticatedRequest, getEffectiveUserId} from '../api/middlewares/isAuth.js';
import {Service, Inject} from 'typedi';
import type {ICartaoCreditoController} from './IControllers/ICartaoCreditoController.js';
import type ICartaoCreditoService from '../services/IServices/ICartaoCreditoService.js';
import type {ICartaoCreditoInputDTO, ICartaoCreditoUpdateDTO} from '../dto/ICartaoCreditoDTO.js';

/**
 * Controller for managing CartaoCredito entities. Handles HTTP requests and responses, and delegates business logic to the CartaoCreditoService.
 */
@Service()
export default class CartaoCreditoController implements ICartaoCreditoController {
    constructor(
        @Inject('CartaoCreditoService') private cartaoService: ICartaoCreditoService
    ) {
    }

    /**
     * Handles the creation of a new CartaoCredito. Expects a JSON body with the necessary fields to create a
     * CartaoCredito. If userId is not provided in the body, it will use the current authenticated user's ID.
     * @param req - Express request object, expected to contain the CartaoCredito input data in the body and optionally the userId.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.
     * @returns A JSON response with the created CartaoCredito DTO on success, or an error message on failure.
     */
    public async createCartao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as ICartaoCreditoInputDTO;
            inputDTO.userId = inputDTO.userId ?? (req as AuthenticatedRequest).currentUser?.id;

            const result = await this.cartaoService.createCartao(inputDTO);
            if (result.isFailure) return res.status(400).json({error: result.error});
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the update of an existing CartaoCredito. Expects the ID of the CartaoCredito to be updated either in the
     * URL parameters or query string, and a JSON body with the fields to update. Only certain fields may be updatable
     * depending on the business rules defined in the service layer.
     * @param req - Express request object, expected to contain the CartaoCredito update data in the body and the ID in
     * the parameters or query string.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.
     * @returns A JSON response with the updated CartaoCredito DTO on success, or an error message on failure.
     */
    public async updateCartao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            const inputDTO = req.body as ICartaoCreditoUpdateDTO;
            if (!id) return res.status(400).json({error: 'ID is required to update cartao'});

            const result = await this.cartaoService.updateCartao(id, inputDTO);
            if (result.isFailure) return res.status(400).json({error: result.error});
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the deletion of a CartaoCredito by its domain ID. Expects the ID of the CartaoCredito to be deleted
     * either in the URL parameters or query string. Delegates the deletion logic to the service layer and returns an
     * appropriate response based on the outcome.
     * @param req - Express request object, expected to contain the ID of the CartaoCredito to delete in the parameters
     * or query string.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.
     * @returns A JSON response indicating success or failure of the deletion operation.
     */
    public async deleteCartaoByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({error: 'ID is required to delete cartao'});

            const result = await this.cartaoService.deleteCartao(id);
            if (result.isFailure) return res.status(400).json({error: result.error});
            return res.status(200).json({success: result.getValue()});
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the retrieval of a CartaoCredito by its domain ID. Expects the ID of the CartaoCredito to be retrieved
     * either in the URL parameters or query string. Delegates the retrieval logic to the service layer and returns the
     * CartaoCredito DTO if found, or an error message if not found.
     * @param req - Express request object, expected to contain the ID of the CartaoCredito to retrieve in the parameters or query string.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.
     * @returns A JSON response with the CartaoCredito DTO on success, or an error message on failure.
     */
    public async getCartaoByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({error: 'ID is required'});

            const result = await this.cartaoService.findCartaoById(id);
            if (result.isFailure) return res.status(404).json({error: result.error});
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the retrieval of all CartaoCredito entities for the current authenticated user. Optionally filters by banco ID.
     * Delegates the retrieval logic to the service layer and returns an array of CartaoCredito DTOs. If a user ID is not
     * available from the authentication context, it will return an error.
     * @param req - Express request object, expected to have the current authenticated user's ID available in the authentication
     * context. Optionally accepts a bancoId query parameter to filter results by banco.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.
     * @returns A JSON response with an array of CartaoCredito DTOs on success, or an error message on failure.
     */
    public async getAllCartoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // Admins get undefined so no userId filter is applied (see all cartões)
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const bancoId = req.query.bancoId as string | undefined;
            const result = await this.cartaoService.findAllCartoes(userId, bancoId);
            if (result.isFailure) return res.status(400).json({error: result.error});
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles the retrieval of the extrato (transaction history) for a specific CartaoCredito. Expects the ID of the
     * Cartao Credito to be retrieved either in the URL parameters or query string, and the authenticated user's ID to
     * be available in the authentication context. Delegates the retrieval logic to the service layer and returns the
     * extrato (list of transactions and current balance) for the specified CartaoCredito.
     * @param req - Express request object, expected to contain the ID of the CartaoCredito to retrieve the extrato for
     * in the parameters or query string, and the authenticated user's ID in the authentication context.
     * @param res - Express response object, used to send back the result of the operation.
     * @param next - Express next function, used for error handling.* @returns A JSON response with the extrato (list
     * of transactions and current balance) for the specified CartaoCredito on success, or an error message on failure.
     */
    public async getExtrato(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = getEffectiveUserId(req as AuthenticatedRequest);
            const cartaoCreditoId = (req.params.id || req.query.id) as string;
            if (!cartaoCreditoId) return res.status(400).json({error: 'ID is required'});

            const result = await this.cartaoService.getExtrato(cartaoCreditoId, userId);
            if (result.isFailure) return res.status(400).json({error: result.error});
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);

        }
    }

    /**
     * Handles payment processing for a CartaoCredito. Calls getExtrato to determine the payment amount,
     * marks all pending Crédito transactions as completed, creates a Saída transaction for the payment,
     * and updates the card period for the next billing cycle.
     * @param req - Express request object containing the card ID in params and new period in body
     * @param res - Express response object for sending the payment transaction result
     * @param next - Express next function for error handling
     * @returns A JSON response with the created payment transaction DTO or error message
     */
    public async pagarCartao(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = (req as AuthenticatedRequest).currentUser?.id as string | undefined;
            const cartaoCreditoId = (req.params.id || req.query.id) as string;
            const { novoPeriodo } = req.body;

            if (!cartaoCreditoId) return res.status(400).json({ error: 'Card ID is required' });
            if (!userId) return res.status(401).json({ error: 'User not authenticated' });
            if (!novoPeriodo || !novoPeriodo.inicio || !novoPeriodo.fecho) {
                return res.status(400).json({ error: 'New period (inicio and fecho) is required' });
            }

            const result = await this.cartaoService.pagarCartao(cartaoCreditoId, userId, novoPeriodo);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }
}
