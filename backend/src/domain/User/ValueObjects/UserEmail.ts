import {Result} from "../../../core/logic/Result.js";
import {ValueObject} from "../../../core/domain/ValueObject.js";
import {Guard} from "../../../core/logic/Guard.js";

/**
 * Properties required to create a UserEmail value object.
 */
interface UserEmailProps {
    value: string;
}

/**
 * UserEmail Value Object class.
 * Validation rules applied on creation:
 * - must be a valid email format
 */
export class UserEmail extends ValueObject<UserEmailProps> {

    /**
     * Gets the user email value.
     */
    get value(): string {
        return this.props.value;
    }

    /**
     * Private constructor to enforce creation via the static create method.
     * @param props - Properties for the UserEmail.
     * @private
     */
    private constructor(props: UserEmailProps) {
        super(props);
    }

    /**
     * Creates a new UserEmail value object.
     * @param value - The user email string.
     * @returns A Result containing the UserEmail instance or an error message.
     */
    public static create(value: string): Result<UserEmail> {
        const guardResult = Guard.againstNullOrUndefined(value, 'UserEmail');
        if (!guardResult.succeeded) {
            return Result.fail<UserEmail>(guardResult.message);
        }

        const trimmed = value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return Result.fail<UserEmail>('Invalid email format');
        }

        return Result.ok<UserEmail>(new UserEmail({value: trimmed}));
    }
}