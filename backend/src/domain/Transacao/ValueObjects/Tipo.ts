import {Result} from "../../../core/logic/Result.js";
import {Guard} from "../../../core/logic/Guard.js";
import {ValueObject} from "../../../core/domain/ValueObject.js";

/**
 * Valid Tipo values for a transaction.
 * These are the values used in the domain: Entrada, Saída, Crédito, Reembolso and Despesa Mensal.
 */
export type Tipos = "Entrada" | "Saída" | "Crédito" | "Reembolso" | "Despesa Mensal" | "Poupança";

/**
 * Properties required to create a Tipo value object.
 */
interface TipoProps {
    value: Tipos;
}

/**
 * Value Object representing the Tipo/Type of a transaction.
 * Ensures only supported values are accepted.
 */
export class Tipo extends ValueObject<TipoProps> {
    /** Returns the tipo value */
    get value(): Tipos {
        return this.props.value;
    }

    private constructor(props: TipoProps) {
        super(props);
    }

    /** Checks whether the provided value is supported by the domain */
    public static isSupported(value: string): value is Tipos {
        return ["Entrada", "Saída", "Crédito", "Reembolso", "Despesa Mensal", "Poupança"].includes(value);
    }

    /**
     * Create a new Tipo value object after validating the input.
     * @param value - The tipo value to create.
     * @return Result<Tipo> - Success with Tipo object or Failure with error message.
     */
    public static create(value: string): Result<Tipo> {
        const guardResult = Guard.againstNullOrUndefined(value, "Tipo");
        if (!guardResult.succeeded) {
            return Result.fail<Tipo>(guardResult.message);
        }

        const normalized = value.trim();

        if (!Tipo.isSupported(normalized)) {
            return Result.fail<Tipo>(`Tipo '${value}' is not supported by the domain.`);
        }

        return Result.ok<Tipo>(new Tipo({value: normalized as Tipos}));
    }

    /**
     * Returns true if the transaction represents money leaving your net worth
     */
    public isExpense(): boolean {
        return this.value === "Saída" || this.value === "Crédito" || this.value === "Despesa Mensal" || this.value === "Poupança";
    }

    /**
     * Returns true if the transaction represents money coming in
     */
    public isIncome(): boolean {
        return this.value === "Entrada" || this.value === "Reembolso";
    }

    /**
     * Helper to determine if it affects the bank balance immediately
     */
    public isLiquidOutflow(): boolean {
        return this.value === "Saída";
    }
}