import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type ICategoriaController from './IControllers/ICategoriaController.js';
import type ICategoriaService from '../services/IServices/ICategoriaService.js';
import type { IInputCategoriaDTO } from '../dto/ICategoriaDTO.js';

/**
 * Controller implementation for Categoria operations.
 */
@Service()
export default class CategoriaController implements ICategoriaController {
    constructor(
        @Inject('CategoriaService') private categoriaService: ICategoriaService
    ) {}

    /**
     * Creates a new Categoria.
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
     * Retrieves all Categorias.
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
     * Retrieves a Categoria by its domain ID.
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
     * Updates an existing Categoria identified by its domain ID.
     */
    public async updateCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required to locate categoria' });

            const inputDTO = req.body as IInputCategoriaDTO;
            const result = await this.categoriaService.updateCategoria(inputDTO, id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json(result.getValue());
        } catch (e) {
            next(e);
        }
    }

    /**
     * Deletes a Categoria identified by its domain ID.
     */
    public async deleteCategoriaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = (req.params.id || req.query.id) as string;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const result = await this.categoriaService.deleteCategoriaById(id);
            if (result.isFailure) return res.status(400).json({ error: result.error });
            return res.status(200).json({ success: result.getValue() });
        } catch (e) {
            next(e);
        }
    }
}
