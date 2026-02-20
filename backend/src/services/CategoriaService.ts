import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type { ICategoriaDTO, IInputCategoriaDTO } from '../dto/ICategoriaDTO.js';
import type ICategoriaService from './IServices/ICategoriaService.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import { Categoria } from '../domain/Categoria/Entities/Categoria.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Result as CoreResult } from '../core/logic/Result.js';
import { CategoriaMap } from '../mappers/CategoriaMap.js';

@Service()
export default class CategoriaService implements ICategoriaService {
    constructor(
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Creates and persists a Categoria.
     */
    public async createCategoria(inputDTO: IInputCategoriaDTO): Promise<Result<ICategoriaDTO>> {
        try {
            if (!inputDTO) return Result.fail<ICategoriaDTO>('No categoria data provided');

            const nameResult = Nome.create(inputDTO.nome);
            const iconResult = Icon.create(inputDTO.icon);

            const combine = CoreResult.combine([nameResult, iconResult]);
            if (combine.isFailure) return Result.fail<ICategoriaDTO>(combine.error || 'Invalid categoria data');

            const categoriaOrError = Categoria.create({
                nome: nameResult.getValue(),
                icon: iconResult.getValue()
            });

            if (categoriaOrError.isFailure) return Result.fail<ICategoriaDTO>(categoriaOrError.errorValue() as unknown as string);

            const saved = await this.categoriaRepo.save(categoriaOrError.getValue());
            return Result.ok<ICategoriaDTO>(CategoriaMap.toDTO(saved) as ICategoriaDTO);
        } catch (e) {
            this.logger.error('CategoriaService.createCategoria error: %o', e);
            return Result.fail<ICategoriaDTO>(e instanceof Error ? e.message : 'Error creating categoria');
        }
    }

    /**
     * Retrieves all Categorias.
     */
    public async getAllCategorias(): Promise<Result<ICategoriaDTO[]>> {
        try {
            const categorias = await this.categoriaRepo.findAll();
            return Result.ok<ICategoriaDTO[]>(categorias.map(c => CategoriaMap.toDTO(c) as ICategoriaDTO));
        } catch (e) {
            this.logger.error('CategoriaService.getAllCategorias error: %o', e);
            return Result.fail<ICategoriaDTO[]>(e instanceof Error ? e.message : 'Error getting all categorias');
        }
    }

    /**
     * Retrieves a Categoria by its domain ID.
     */
    public async getCategoriaById(id: string): Promise<Result<ICategoriaDTO>> {
        try {
            if (!id) return Result.fail<ICategoriaDTO>('ID is required');
            const categoria = await this.categoriaRepo.findById(id);
            if (!categoria) return Result.fail<ICategoriaDTO>(`Categoria not found with id=${id}`);
            return Result.ok<ICategoriaDTO>(CategoriaMap.toDTO(categoria) as ICategoriaDTO);
        } catch (e) {
            this.logger.error('CategoriaService.getCategoriaById error: %o', e);
            return Result.fail<ICategoriaDTO>(e instanceof Error ? e.message : 'Error getting categoria by id');
        }
    }

    /**
     * Updates an existing Categoria identified by its domain ID.
     */
    public async updateCategoria(updateDTO: IInputCategoriaDTO, id: string): Promise<Result<ICategoriaDTO>> {
        try {
            if (!updateDTO) return Result.fail<ICategoriaDTO>('No update data provided');
            if (!id) return Result.fail<ICategoriaDTO>('ID is required to locate categoria');

            const existing = await this.categoriaRepo.findById(id);
            if (!existing) return Result.fail<ICategoriaDTO>(`Categoria not found with id=${id}`);

            const name = updateDTO.nome ? Nome.create(updateDTO.nome) : CoreResult.ok(existing.nome);
            const icon = updateDTO.icon ? Icon.create(updateDTO.icon) : CoreResult.ok(existing.icon);

            const combine = CoreResult.combine([name, icon]);
            if (combine.isFailure) return Result.fail<ICategoriaDTO>(combine.error || 'Invalid update data');

            const categoriaOrError = Categoria.create(
                { nome: name.getValue(), icon: icon.getValue() },
                existing.id
            );
            if (categoriaOrError.isFailure) return Result.fail<ICategoriaDTO>(categoriaOrError.errorValue() as unknown as string);

            const updated = await this.categoriaRepo.update(categoriaOrError.getValue(), id);
            return Result.ok<ICategoriaDTO>(CategoriaMap.toDTO(updated) as ICategoriaDTO);
        } catch (e) {
            this.logger.error('CategoriaService.updateCategoria error: %o', e);
            return Result.fail<ICategoriaDTO>(e instanceof Error ? e.message : 'Error updating categoria');
        }
    }

    /**
     * Deletes a Categoria by its domain ID.
     */
    public async deleteCategoriaById(id: string): Promise<Result<boolean>> {
        try {
            if (!id) return Result.fail<boolean>('ID is required');
            const exists = await this.categoriaRepo.findById(id);
            if (!exists) return Result.fail<boolean>(`Categoria not found with id=${id}`);
            await this.categoriaRepo.deleteById(id);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('CategoriaService.deleteCategoriaById error: %o', e);
            return Result.fail<boolean>(e instanceof Error ? e.message : 'Error deleting categoria');
        }
    }
}
