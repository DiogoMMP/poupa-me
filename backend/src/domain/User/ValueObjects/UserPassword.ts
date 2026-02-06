import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Result } from "../../../core/logic/Result.js";
import { Guard } from "../../../core/logic/Guard.js";
import * as bcrypt from 'bcryptjs';

/**
 * Properties required to create a UserPassword value object.
 */
interface UserPasswordProps {
    value: string;
}

/**
 * Value Object representing a User's password.
 * Handles password hashing and comparison.
 */
export class UserPassword extends ValueObject<UserPasswordProps> {
    public static readonly minLength: number = 6;

    /**
     * Gets the hashed password value.
     */
    get value(): string {
        return this.props.value;
    }

    /**
     * Private constructor to enforce creation via the static create method.
     * @param props - Properties for the UserPassword.
     * @private
     */
    private constructor(props: UserPasswordProps) {
        super(props);
    }

    /**
     * Compares a plain text password with the stored hashed password.
     * @param plainTextPassword The plain text password to compare.
     * @returns Promise resolving to true if the passwords match, false otherwise.
     */
    public async comparePassword(plainTextPassword: string): Promise<boolean> {
        return bcrypt.compare(plainTextPassword, this.props.value);
    }

    /**
     * Hashes a plain text password.
     * @param password The plain text password to hash.
     * @returns Promise resolving to the hashed password.
     */
    private static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    /**
     * Creates a new UserPassword value object.
     * If the password is not hashed, it will be hashed before creating the object.
     * @returns Result containing the UserPassword or an error message.
     * @param password The plain text or hashed password.
     * @param isHashed Indicates if the provided password is already hashed.
     */
    public static async create(password: string, isHashed: boolean = false): Promise<Result<UserPassword>> {
        // 1. Verify if the password is null or undefined
        const guardResult = Guard.againstNullOrUndefined(password, 'password');
        if (!guardResult.succeeded) {
            return Result.fail<UserPassword>(guardResult.message);
        }

        // 2. If not hashed, validate length and hash it
        if (!isHashed) {
            if (password.length < this.minLength) {
                return Result.fail<UserPassword>(`A password deve ter pelo menos ${this.minLength} caracteres.`);
            }

            const hashedPassword = await this.hashPassword(password);
            return Result.ok<UserPassword>(new UserPassword({ value: hashedPassword }));
        }

        // 3. If already hashed, just create the UserPassword object
        return Result.ok<UserPassword>(new UserPassword({ value: password }));
    }
}