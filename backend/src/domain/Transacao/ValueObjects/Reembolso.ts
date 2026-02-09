import { ValueObject } from "../../../core/domain/ValueObject.js";
import { UniqueEntityID } from "../../../core/domain/UniqueEntityID.js";
import { Result } from "../../../core/logic/Result.js";

/**
 * Value Object representing a Refund (Reembolso) linked to an original transaction.
 */
interface ReembolsoProps {
    originalTransactionId: UniqueEntityID;
}

/**
 * Reembolso Value Object
 */
export class Reembolso extends ValueObject<ReembolsoProps> {

    /**
     * Gets the ID of the original transaction that this refund is linked to.
     */
    get originalTransactionId(): UniqueEntityID {
        return this.props.originalTransactionId;
    }

    /**
     * Creates a new Reembolso instance.
     * @param props - The properties for the Reembolso.
     * @private
     */
    private constructor(props: ReembolsoProps) {
        super(props);
    }

    /**
     * Creates a Refund link to an existing transaction.
     * @param transactionId - The ID of the original expense.
     */
    public static create(transactionId: UniqueEntityID): Result<Reembolso> {
        if (!transactionId) {
            return Result.fail<Reembolso>("Original transaction ID is required.");
        }

        return Result.ok<Reembolso>(new Reembolso({ originalTransactionId: transactionId }));
    }
}