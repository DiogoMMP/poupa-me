import {Result} from "../../../core/logic/Result.js";
import {Guard} from "../../../core/logic/Guard.js";
import {ValueObject} from "../../../core/domain/ValueObject.js";

/**
 * Valid Status types for a transaction.
 * These are the values used in the domain: "Pendente" and "Concluído".
 */
export type StatusType = "Pendente" | "Concluído";

/**
 * Properties required to create a Status value object.
 */
interface StatusProps {
    value: StatusType;
}

/**
 * Value Object representing the Status of a transaction.
 * Ensures only supported values are accepted.
 */
export class Status extends ValueObject<StatusProps> {
    /** Returns the status value */
    get value(): StatusType {
        return this.props.value;
    }

    private constructor(props: StatusProps) {
        super(props);
    }

    /** Checks whether the provided value is supported by the domain */
    public static isSupported(value: string): value is StatusType {
        return ["Pendente", "Concluído"].includes(value);
    }

    /**
     * Create a new Status value object after validating the input.
     * @param value - The status value to create.
     * @return Result<Status> - Success with Status object or Failure with error message.
     */
    public static create(value: string): Result<Status> {
        const guardResult = Guard.againstNullOrUndefined(value, "Status");
        if (!guardResult.succeeded) {
            // Use the Guard's message (likely generic). If needed, customize here.
            return Result.fail<Status>(guardResult.message);
        }

        const normalized = value.trim();

        if (!Status.isSupported(normalized)) {
            return Result.fail<Status>(`Status '${value}' is not supported by the domain.`);
        }

        return Result.ok<Status>(new Status({value: normalized as StatusType}));
    }
}