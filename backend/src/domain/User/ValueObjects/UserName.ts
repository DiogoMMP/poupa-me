import {ValueObject} from "../../../core/domain/ValueObject.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";

/**
 * Properties required to create a UserName value object.
 */
interface UserNameProps {
    value: string;
}

/**
 * Maximum length for a UserName.
 */
const MAX_LENGTH = 50;

/**
 * UserName Value Object class.
 * Validation rules applied on creation:
 * - non-empty (after trim)
 * - maximum length enforced (MAX_LENGTH)
 */
export class UserName extends ValueObject<UserNameProps> {

    /**
     * Gets the user name value.
     */
    get value(): string {
        return this.props.value;
    }

    /**
     * Private constructor to enforce creation via the static create method.
     * @param props - Properties for the UserName.
     * @private
     */
    private constructor( props: UserNameProps) {
        super(props);
    }

    /**
     * Creates a new UserName value object.
     * @param value - The user name string.
     * @returns A Result containing the UserName instance or an error message.
     */
    public static create(value: string): Result<UserName> {
        const guardResult = Guard.againstNullOrUndefined(value, 'IncidentTypeName');
        if (!guardResult.succeeded) {
            return Result.fail<UserName>(guardResult.message);
        }

        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return Result.fail<UserName>('UserName cannot be empty');
        }

        if (trimmed.length > MAX_LENGTH) {
            return Result.fail<UserName>(`UserName must not exceed ${MAX_LENGTH} characters`);
        }

        return Result.ok<UserName>(new UserName({value: trimmed}));
    }
}