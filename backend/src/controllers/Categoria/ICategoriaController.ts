import type {NextFunction, Request, Response} from 'express';

/**
 * Controller interface for Categoria operations
 */
export default interface ICategoriaController {

    /**
     * Creates a new Categoria
     */
    createCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Retrieves a Categoria by domain ID
     */
    getCategoriaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Retrieves all Categorias
     */
    getAllCategorias(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Updates a Categoria
     */
    updateCategoria(req: Request, res: Response, next: NextFunction): Promise<Response | void>;

    /**
     * Deletes a Categoria by domain ID
     */
    deleteCategoriaByDomainId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

