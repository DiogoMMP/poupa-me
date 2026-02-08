import { Service, Inject } from 'typedi';
import type IUserRepo from './IRepos/IUserRepo.js';
import { User } from '../domain/User/Entities/User.js';
import { UserMap } from '../mappers/UserMap.js';
import { UserEntity } from '../persistence/entities/UserEntity.js';
import type { DataSource, Repository } from 'typeorm';

/**
 * User Repository implementation using TypeORM. This class is responsible for handling all database operations related
 * to the User entity, including saving, finding by email or domain ID, retrieving all users, and deleting by domain ID.
 * It uses a Mapper to convert between the domain model and the persistence model.
 * The repository is designed to be injected with a DataSource and a logger, allowing for flexible configuration and
 * testing.
 * Error handling is implemented to log any issues that arise during database operations, ensuring that problems can
 * be diagnosed and addressed effectively.
 * The repository methods return domain entities, abstracting away the details of the underlying database interactions
 * from the rest of the application.
 */
@Service()
export default class UserRepo implements IUserRepo {
    private repo: Repository<UserEntity>;

    /**
     * Constructor for the UserRepo class. It initializes the repository by injecting a DataSource and a logger. The
     * DataSource is used to get the repository for the UserEntity, which allows for performing database operations.
     * The logger is used to log any errors that occur during these operations.
     * @param dataSource - The DataSource instance used to access the database and perform operations on the UserEntity.
     * @param logger - A logging instance used to log errors and other relevant information during database operations.
     */
    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: any
    ) {
        this.repo = this.dataSource.getRepository(UserEntity);
    }

    /**
     * Saves a User entity to the database. It first converts the domain User object to a persistence format using the
     * @param user - The User domain entity that needs to be saved to the database. This object will be mapped to a
     * persistence format before being saved.
     * @returns A Promise that resolves to the saved User domain entity. If the save operation is successful, the method
     * returns the User object as it exists in the domain model after being persisted. If there is an error during the
     * save operation, it logs the error and rethrows it.
     */
    public async save(user: User): Promise<User> {
        try {
            const raw = UserMap.toPersistence(user);

            // TypeORM: create() creates an instance of the entity with the given data, but does not save it to the database.
            const entity = this.repo.create(raw);
            const saved = await this.repo.save(entity);

            const domain = await UserMap.toDomain(saved);

            if (!domain) throw new Error('Failed to map saved user to domain');
            return domain;
        } catch (err) {
            this.logger.error('UserRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a User entity in the database by its email. It queries the database for a record matching the provided
     * email. If a record is found, it uses the UserMap to convert the persistence format back to the domain model and
     * returns it. If no record is found, it returns null.
     * @param email - The email address of the User to be found in the database. This is used as a search criterion to
     * locate the corresponding User record.
     * @returns A Promise that resolves to a User domain entity if a matching record is found, or null if no such record
     * exists. If there is an error during the database query, it logs the error and rethrows it.
     */
    public async findByEmail(email: string): Promise<User | null> {
        // Use case-insensitive match to be robust with email casing differences
        try {
            // Use case-insensitive search via LOWER comparison for portability
            const row = await this.repo.createQueryBuilder('user')
                .where('LOWER(user.email) = LOWER(:email)', { email })
                .getOne();
            if (!row) return null;
            return await UserMap.toDomain(row);
        } catch (err) {
            this.logger.error('UserRepo.findByEmail error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a User entity in the database by its domain ID. It queries the database for a record matching the provided
     * domain ID. If a record is found, it uses the UserMap to convert the persistence format back to the domain model and
     * returns it. If no record is found, it returns null.
     * @param domainId - The domain ID of the User to be found in the database. This is used as a search criterion to
     * locate the corresponding User record.
     * @returns A Promise that resolves to a User domain entity if a matching record is found, or null if no such record
     * exists. If there is an error during the database query, it logs the error and rethrows it.
     */
    public async findByDomainId(domainId: string): Promise<User | null> {
        const row = await this.repo.findOne({ where: { domainId } });
        if (!row) return null;
        return await UserMap.toDomain(row);
    }

    /**
     * Finds all User entities in the database. It retrieves all records from the UserEntity table, ordered by domain ID
     * in ascending order. For each record, it uses the UserMap to convert the persistence format back to the domain model
     * and collects them into an array, which is then returned.
     * @returns A Promise that resolves to an array of User domain entities representing all the User records in the
     * database. If there is an error during the database query, it logs the error and rethrows it.
     */
    public async findAll(): Promise<User[]> {
        const rows = await this.repo.find({ order: { domainId: 'ASC' } });
        const res: User[] = [];

        for (const r of rows) {
            const d = await UserMap.toDomain(r);
            if (d) res.push(d);
        }
        return res;
    }

    public async deleteByEmail(email: string): Promise<void> {
        try {
            await this.repo.createQueryBuilder()
                .delete()
                .from(UserEntity)
                .where('LOWER(email) = LOWER(:email)', { email })
                .execute();
        } catch (err) {
            this.logger.error('UserRepo.deleteByEmail error: %o', err);
            throw err;
        }
    }

    public async updateByEmail(user: User, email: string): Promise<User> {
        try {
            const raw = UserMap.toPersistence(user);

            // Update the row matched by email
            await this.repo.createQueryBuilder()
                .update(UserEntity)
                .set({
                    email: raw.email,
                    name: raw.name,
                    passwordHash: raw.passwordHash,
                    role: raw.role
                })
                .where('LOWER(email) = LOWER(:email)', { email })
                .execute();

            // Reload the updated row
            const saved = await this.repo.createQueryBuilder('user')
                .where('LOWER(user.email) = LOWER(:email)', { email })
                .getOne();

            if (!saved) throw new Error('Failed to find updated user by email');

            const domain = await UserMap.toDomain(saved);
            if (!domain) throw new Error('Failed to map updated user to domain');
            return domain;
        } catch (err) {
            this.logger.error('UserRepo.updateByEmail error: %o', err);
            throw err;
        }
    }
}
