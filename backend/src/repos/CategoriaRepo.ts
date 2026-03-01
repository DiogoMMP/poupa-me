import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ICategoriaRepo from "./IRepos/ICategoriaRepo.js";
import type {Categoria} from "../domain/Categoria/Entities/Categoria.js";
import {CategoriaMap} from "../mappers/CategoriaMap.js";
import {CategoriaEntity} from "../persistence/entities/CategoriaEntity.js";
import { CategoriaIdHelper, extractSequenceNumber } from '../utils/IDGenerator.js';

/**
 * Categoria Repository implementation using TypeORM. This class is responsible for handling all database operations related
 * to the Categoria entity, including saving, updating, finding by domain ID or name, retrieving all categorias, and deleting by domain ID.
 * It uses a Mapper to convert between the domain model and the persistence model.
 * The repository is designed to be injected with a DataSource and a logger, allowing for flexible configuration and
 * testing.
 * Error handling is implemented to log any issues that arise during database operations, ensuring that problems can
 * be diagnosed and addressed effectively.
 * The repository methods return domain entities, abstracting away the details of the underlying database interactions
 * from the rest of the application.
 */
@Service()
export default class CategoriaRepo implements ICategoriaRepo {
    private repo: Repository<CategoriaEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(CategoriaEntity);
    }

    /**
     * Saves a Categoria entity to the database. It first converts the domain Categoria object to a persistence format
     * using the CategoriaMap. Then it creates a new entity instance and saves it to the database. After saving, it maps
     * the saved entity back to the domain model and returns it. If any error occurs during this process, it logs the
     * error and rethrows it.
     * @param categoria - The Categoria domain entity that needs to be saved to the database. This object will be mapped
     * to a persistence format before being saved.
     * @returns A Promise that resolves to the saved Categoria domain entity. If the save operation is successful, the
     * method returns the Categoria object as it exists in the domain model after being persisted. If there is an error
     * during the save operation, it logs the error and rethrows it.
     */
    public async save(categoria: Categoria): Promise<Categoria> {
        try {
            const raw = CategoriaMap.toPersistence(categoria);

            // Always generate sequential domain ID (override UUID from domain entity)
            const allCategorias = await this.repo.find({ select: ['domainId'], order: { id: 'DESC' }, take: 100 });
            let maxSeq = 0;
            for (const c of allCategorias) {
                const seq = extractSequenceNumber(String(c.domainId), CategoriaIdHelper.prefix);
                if (seq !== null && seq > maxSeq) maxSeq = seq;
            }
            raw.domainId = maxSeq === 0 ? CategoriaIdHelper.generateFirst() : CategoriaIdHelper.generateNext(maxSeq);

            const entity = this.repo.create(raw as unknown as CategoriaEntity);
            const saved = await this.repo.save(entity);

            if (!saved) throw new Error('Failed to save categoria');
            // map back to domain
            const domain = await CategoriaMap.toDomain(saved);
            if (!domain) throw new Error('Failed to map saved categoria to domain');
            return domain;
        } catch (err) {
            this.logger.error('CategoriaRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Updates an existing Categoria entity in the database, located by its domain ID.
     * @param categoria - The Categoria domain entity with updated values.
     * @param id - The domain ID of the Categoria to update.
     */
    public async update(categoria: Categoria, id: string): Promise<Categoria> {
        try {
            const raw = CategoriaMap.toPersistence(categoria);

            await this.repo.createQueryBuilder()
                .update(CategoriaEntity)
                .set({ nome: raw.nome as string, icon: raw.icon as string })
                .where('domain_id = :domainId', { domainId: id })
                .execute();

            const saved = await this.repo.findOne({ where: { domainId: id } });
            if (!saved) throw new Error('Failed to find updated categoria by domainId');
            const domain = await CategoriaMap.toDomain(saved);
            if (!domain) throw new Error('Failed to map updated categoria to domain');
            return domain;
        } catch (err) {
            this.logger.error('CategoriaRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Deletes a Categoria entity from the database by its domain ID.
     * @param id - The domain ID of the Categoria to delete.
     */
    public async deleteById(id: string): Promise<void> {
        try {
            await this.repo.delete({ domainId: id });
        } catch (err) {
            this.logger.error('CategoriaRepo.deleteById error: %o', err);
            throw err;
        }
    }


    /**
     * Finds all Categoria entities in the database. It uses the repository's find method to retrieve all records,
     * ordered by ID in ascending order.
     * For each retrieved record, it maps the persistence entity back to the domain model and collects them into an
     * array. Finally, it returns the array of Categoria domain entities.
     * If any error occurs during this process, it logs the error and rethrows it.
      * @returns A Promise that resolves to an array of all Categoria domain entities found in the database. If there
     * is an error during the find operation, it logs the error and rethrows it.
     */
    public async findAll(): Promise<Categoria[]> {
        const rows = await this.repo.find({ order: { id: 'ASC' } });
        const res: Categoria[] = [];

        for (const r of rows) {
            const d = await CategoriaMap.toDomain(r);
            if (d) res.push(d);
        }
        return res;
    }

    /**
     * Finds a Categoria entity in the database by its domain ID. It uses the repository's findOne method to retrieve the record
     * that matches the given domain ID. If a record is found, it maps the persistence entity back to the domain model and returns it.
     * If no record is found, it returns null. If any error occurs during this process, it logs the error and rethrows it.
     * @param id - The domain ID of the Categoria to find.
     * @returns A Promise that resolves to the found Categoria domain entity or null if no record is found. If there is an
     * error during the find operation, it logs the error and rethrows it.
     */
    public async findById(id: string): Promise<Categoria | null> {
        const row = await this.repo.findOne({ where: { domainId: id } });
        if (!row) return null;
        return await CategoriaMap.toDomain(row);
    }
}