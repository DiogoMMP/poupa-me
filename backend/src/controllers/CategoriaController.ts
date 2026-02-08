import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type ICategoriaController from './IControllers/ICategoriaController.js';
import type ICategoriaService from '../services/IServices/ICategoriaService.js';
import type { IInputCategoriaDTO } from '../dto/ICategoriaDTO.js';

/**
 * Controller implementation for Categoria operations
 */
@Service()
export default class CategoriaController implements ICategoriaController {
    constructor(
        @Inject('CategoriaService') private categoriaService: ICategoriaService
    ) {}

    /**
     * Handles the creation of a new Categoria
     * @param req Express request object containing the Categoria data in the body
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async createCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const inputDTO = req.body as IInputCategoriaDTO;
            const result = await this.categoriaService.createCategoria(inputDTO);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(201).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving a Categoria by its name
     * @param req Express request object containing the Categoria name in the query parameters or URL parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getCategoriaByNome(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const nome = (req.query.nome || req.params.nome) as string;
            if (!nome) return res.status(400).json({ error: 'Name is required' });

            const result = await this.categoriaService.getCategoriaByNome(nome);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving all Categorias
     * @param req Express request object (not used in this method but included for consistency)
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getAllCategorias(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await this.categoriaService.getAllCategorias();
            if (result.isFailure) return res.status(500).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles updating an existing Categoria
     * @param req Express request object containing the updated Categoria data in the body, including the ID
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async updateCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const nome = (req.query.nome || req.params.nome) as string;
            const inputDTO = req.body as IInputCategoriaDTO;
            if (!nome) return res.status(400).json({ error: 'Name is required to locate categoria' });

            const result = await this.categoriaService.updateCategoria(inputDTO, nome);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles retrieving a Categoria by its domain ID
     * @param req Express request object containing the Categoria ID in the URL parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async getCategoriaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const result = await this.categoriaService.getCategoriaById(id);
            if (result.isFailure) return res.status(404).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles deleting a Categoria by its domain ID
     * @param req Express request object containing the Categoria ID in the URL parameters
     * @param res Express response object used to send back the result
     * @param next Express next function for error handling
     */
    public async deleteCategoriaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const nome = (req.query.nome || req.params.nome) as string;
            if (!nome) return res.status(400).json({ error: 'Name is required' });

            const result = await this.categoriaService.deleteCategoriaByNome(nome);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) {
            next(e);
        }
    }
}
