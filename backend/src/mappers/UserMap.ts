import { Mapper } from '../core/infra/Mapper.js';
import { User } from '../domain/User/Entities/User.js';
import { UserName } from '../domain/User/ValueObjects/UserName.js';
import { UserEmail } from '../domain/User/ValueObjects/UserEmail.js';
import { UserPassword } from '../domain/User/ValueObjects/UserPassword.js';
import { UserRole } from '../domain/User/ValueObjects/UserRole.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { Result } from '../core/logic/Result.js';

/**
 * UserMap is a Mapper class responsible for converting between the User domain entity and its persistence representation.
 * It provides methods to map raw database records to domain entities, convert domain entities to a format suitable for
 * database storage, and create Data Transfer Objects (DTOs) for API responses. The mapping process includes validation
 * of Value Objects and handling of asynchronous operations, such as password hashing. This class abstracts away the
 * details of how User entities are stored and retrieved from the database, allowing the rest of the application to
 * work with clean domain models.
 */
export class UserMap extends Mapper<User> {

    /**
     * Converts a raw database record into a User domain entity. This method takes care of creating the necessary Value
     * Objects for the User's properties, validating them, and handling any asynchronous operations required for the
     * password.
     * If the input is invalid or if any of the Value Objects fail to validate, it returns null. Otherwise, it returns a
     * fully constructed User domain entity.
     * @param raw - The raw database record representing a User, which may include fields like id, domainId, email,
     * name, passwordHash, and role.
     * @return A Promise that resolves to a User domain entity if the mapping is successful, or null if the input is
     * invalid or if any of the Value Objects fail to validate.
     */
    public static async toDomain(raw: any): Promise<User | null> {
        if (!raw) return null;

        const nameResult = UserName.create(raw.name);
        const emailResult = UserEmail.create(raw.email);
        const roleResult = UserRole.create(raw.role || 'Guest');

        const passwordResult = await UserPassword.create(
            raw.passwordHash || raw.password,
            true
        );

        const result = Result.combine([nameResult, emailResult, roleResult, passwordResult]);

        if (result.isFailure) {
            return null;
        }

        const userOrError = User.create(
            {
                name: nameResult.getValue(),
                email: emailResult.getValue(),
                password: passwordResult.getValue(),
                role: roleResult.getValue(),
            },
            new UniqueEntityID(raw.domainId || raw.id)
        );

        return userOrError.isSuccess ? userOrError.getValue() : null;
    }

    /**
     * Converts a User domain entity into a format suitable for database storage. This method extracts the necessary
     * fields from the User entity and formats them according to the expected structure of the database record.
     * @param user - The User domain entity that needs to be converted into a persistence format for database storage.
     * @return An object representing the User in a format suitable for database storage, which may include fields like
     * domainId, email, name, passwordHash, and role. Additional fields such as isActive and locale can be added if the
     * domain supports them.
     */
    public static toPersistence(user: User): any {
        return {
            domainId: user.id.toString(),
            email: user.email.value,
            name: user.name.value,
            passwordHash: user.password.value,
            role: user.role.value,
        };
    }

    /**
     * Converts a User domain entity into a Data Transfer Object (DTO) for API responses. This method extracts the necessary
     * fields from the User entity and formats them in a way that is suitable for sending in API responses, typically
     * excluding sensitive information like passwords.
     * @param user - The User domain entity that needs to be converted into a DTO for API responses.
     * @return An object representing the User in a format suitable for API responses, which may include fields like id,
     * email, name, and role. Sensitive information such as password hashes is intentionally excluded from the DTO.
     */
    public static toDTO(user: User): any {
        return {
            id: user.id.toString(),
            email: user.email.value,
            name: user.name.value,
            role: user.role.value
        };
    }
}