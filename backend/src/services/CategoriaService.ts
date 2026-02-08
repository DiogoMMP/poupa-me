import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type { ICategoriaDTO, IInputCategoriaDTO } from '../dto/ICategoriaDTO.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import { Categoria } from '../domain/Categoria/Entities/Categoria.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Result as CoreResult } from '../core/logic/Result.js';
import { CategoriaMap } from '../mappers/CategoriaMap.js';

@Service()
export default class CategoriaService {
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
            const categoria = categoriaOrError.getValue();

            const saved = await this.categoriaRepo.save(categoria);
            const dto = CategoriaMap.toDTO(saved) as ICategoriaDTO;
            return Result.ok<ICategoriaDTO>(dto);
        } catch (e) {
            this.logger.error('CategoriaService.createCategoria error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating categoria';
            return Result.fail<ICategoriaDTO>(message);
        }
    }

    /**
     * Retrieves Categorias by name.
     */
    public async getCategoriaByNome(nome: string): Promise<Result<ICategoriaDTO[]>> {
        try {
            if (!nome) return Result.fail<ICategoriaDTO[]>('Name is required');
            const categoria = await this.categoriaRepo.findByName(nome);
            if (!categoria) return Result.ok<ICategoriaDTO[]>([]);
            const dto = CategoriaMap.toDTO(categoria) as ICategoriaDTO;
            return Result.ok<ICategoriaDTO[]>([dto]);
        } catch (e) {
            this.logger.error('CategoriaService.getCategoriaByNome error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting categoria by nome';
            return Result.fail<ICategoriaDTO[]>(message);
        }
    }

    /**
     * Retrieves all Categorias.
     */
    public async getAllCategorias(): Promise<Result<ICategoriaDTO[]>> {
        try {
            const categorias = await this.categoriaRepo.findAll();
            const dtos = categorias.map(c => CategoriaMap.toDTO(c) as ICategoriaDTO);
            return Result.ok<ICategoriaDTO[]>(dtos);
        } catch (e) {
            this.logger.error('CategoriaService.getAllCategorias error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting all categorias';
            return Result.fail<ICategoriaDTO[]>(message);
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
            const dto = CategoriaMap.toDTO(categoria) as ICategoriaDTO;
            return Result.ok<ICategoriaDTO>(dto);
        } catch (e) {
            this.logger.error('CategoriaService.getCategoriaById error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting categoria by id';
            return Result.fail<ICategoriaDTO>(message);
        }
    }

    /**
     * Updates a Categoria. This method first checks if the update data and the name of the Categoria to update are
     * provided. It then attempts to find the existing Categoria by its name.
     */
    public async updateCategoria(updateDTO: IInputCategoriaDTO, nome: string): Promise<Result<ICategoriaDTO>> {
        try {
            if (!updateDTO) return Result.fail<ICategoriaDTO>('No update data provided');
            if (!nome) return Result.fail<ICategoriaDTO>('Name is required to locate categoria');

            // find existing by provided nome
            const existing = await this.categoriaRepo.findByName(nome);

            if (!existing) return Result.fail<ICategoriaDTO>('Categoria not found to update');

            const name = updateDTO.nome ? Nome.create(updateDTO.nome) : CoreResult.ok(existing.nome);
            const icon = updateDTO.icon ? Icon.create(updateDTO.icon) : CoreResult.ok(existing.icon);

            const combine = CoreResult.combine([name, icon]);
            if (combine.isFailure) return Result.fail<ICategoriaDTO>(combine.error || 'Invalid update data');

            const categoriaOrError = Categoria.create(
                {
                    nome: name.getValue(),
                    icon: icon.getValue()
                },
                // preserve the existing domain id so update keeps same id
                existing.id
            );

            if (categoriaOrError.isFailure) return Result.fail<ICategoriaDTO>(categoriaOrError.errorValue() as unknown as string);

            const updatedDomain = categoriaOrError.getValue();
            const updated = await this.categoriaRepo.update(updatedDomain, nome);
            const dto = CategoriaMap.toDTO(updated) as ICategoriaDTO;
            return Result.ok<ICategoriaDTO>(dto);
        } catch (e) {
            this.logger.error('CategoriaService.updateCategoria error: %o', e);
            const message = e instanceof Error ? e.message : 'Error updating categoria';
            return Result.fail<ICategoriaDTO>(message);
        }
    }

    /**
     * Deletes a Categoria by its name. This method checks if the name is provided, verifies that a Categoria with the given name exists,
     */
    public async deleteCategoriaByNome(name: string): Promise<Result<boolean>> {
        try {
            if (!name) return Result.fail<boolean>('Name is required');
            const exists = await this.categoriaRepo.findByName(name);
            if (!exists) return Result.fail<boolean>(`Categoria not found with nome=${name}`);
            await this.categoriaRepo.deleteByName(name);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('CategoriaService.deleteCategoriaByNome error: %o', e);
            const message = e instanceof Error ? e.message : 'Error deleting categoria';
            return Result.fail<boolean>(message);
        }
    }
}
