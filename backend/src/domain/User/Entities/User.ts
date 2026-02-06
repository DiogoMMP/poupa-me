import type {UserName} from "../ValueObjects/UserName.js";
import type {UserEmail} from "../ValueObjects/UserEmail.js";
import type {UserPassword} from "../ValueObjects/UserPassword.js";
import {AggregateRoot} from "../../../core/domain/AggregateRoot.js";
import type {UserRole} from "../ValueObjects/UserRole.js";
import type {UniqueEntityID} from "../../../core/domain/UniqueEntityID.js";
import {Result} from "../../../core/logic/Result.js";
import {Guard} from "../../../core/logic/Guard.js";

/**
 * Interface representing the properties of a User entity
 */
interface UserProps {
    name: UserName;
    email: UserEmail;
    password: UserPassword;
    role: UserRole;
}

/**
 * Aggregate root representing a User in the system
 */
export class User extends AggregateRoot<UserProps> {

    /**
     * Gets the name of the User
     */
    get name(): UserName {
        return this.props.name;
    }

    /**
     * Gets the email of the User
     */
    get email(): UserEmail {
        return this.props.email;
    }

    /**
     * Gets the password of the User
     */
    get password(): UserPassword {
        return this.props.password;
    }

    /**
     * Gets the role of the User
     */
    get role(): UserRole {
        return this.props.role;
    }

    /**
     * Private constructor to enforce the use of the static create method for instantiation
     * @param props - The properties of the User entity
     * @param id - Optional unique identifier for the User entity
     * @private
     */
    private constructor(props: UserProps, id?: UniqueEntityID) {
        super(props, id);
    }

    /**
     * Static factory method to create a new User instance with validation
     * @param props - The properties required to create a User
     * @param id - Optional unique identifier for the User entity
     * @returns A Result object containing either the created User or an error message
     */
    public static create(props: UserProps, id?: UniqueEntityID): Result<User> {
        const guardedProps = [
            { argument: props.name, argumentName: 'name' },
            { argument: props.email, argumentName: 'email' },
            { argument: props.password, argumentName: 'password' },
            { argument: props.role, argumentName: 'role' }
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<User>(guardResult.message || 'Invalid user properties');
        }

        const user = new User(props, id);
        return Result.ok<User>(user);
    }
}