import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Result } from "../../../core/logic/Result.js";
import { Guard } from "../../../core/logic/Guard.js";

/**
 * Types of user roles supported by the system.
 */
export type UserRoleType = "Admin" | "User" | "Guest";

/**
 * Properties of the UserRole Value Object.
 */
interface UserRoleProps {
    value: UserRoleType;
}

/**
 * Value Object representing a user's role within the system.
 */
export class UserRole extends ValueObject<UserRoleProps> {

    /**
     * Obtains the value of the user role.
     */
    get value(): UserRoleType {
        return this.props.value;
    }

    /**
     * Private constructor to enforce the use of the static create method.
     * @param props - Properties of the UserRole
     */
    private constructor(props: UserRoleProps) {
        super(props);
    }

    /**
     * Verify if the provided role is supported.
     */
    public static isSupported(value: string): value is UserRoleType {
        return ["Admin", "User", "Guest"].includes(value);
    }

    /**
     * Create a new UserRole Value Object.
     * @param role - The role to be assigned
     * @returns Result containing the UserRole or an error message
     */
    public static create(role: string): Result<UserRole> {
        const guardResult = Guard.againstNullOrUndefined(role, "user role");
        if (!guardResult.succeeded) {
            return Result.fail<UserRole>(guardResult.message);
        }

        const normalized = role.trim();

        if (!UserRole.isSupported(normalized)) {
            return Result.fail<UserRole>(`O papel '${role}' não é suportado pelo sistema.`);
        }

        return Result.ok<UserRole>(new UserRole({ value: normalized as UserRoleType }));
    }
}