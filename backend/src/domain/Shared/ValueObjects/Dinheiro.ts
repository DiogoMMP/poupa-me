import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Result } from "../../../core/logic/Result.js";
import { Guard } from "../../../core/logic/Guard.js";

/**
 * Value Object representing a monetary amount with its associated currency.
 * The value can be positive or negative, and the currency is represented by a 3-character ISO code (e.g., EUR).
 */
interface DinheiroProps {
    value: number;
    moeda: string;
}

/**
 * Value Object class for Dinheiro, ensuring that the monetary amount and currency are valid according to defined rules.
 */
export class Dinheiro extends ValueObject<DinheiroProps> {
    get value(): number {
        return this.props.value;
    }

    get moeda(): string {
        return this.props.moeda;
    }

    private constructor(props: DinheiroProps) {
        super(props);
    }

    /**
     * Creates a new Dinheiro instance.
     * @param value - The monetary amount (can be negative).
     * @param moeda - The ISO currency code (defaults to 'EUR').
     */
    public static create(value: number, moeda: string = 'EUR'): Result<Dinheiro> {
        const guardResult = Guard.againstNullOrUndefined(value, 'value');
        if (!guardResult.succeeded) {
            return Result.fail<Dinheiro>(guardResult.message);
        }

        if (!moeda || moeda.length !== 3) {
            return Result.fail<Dinheiro>("Currency must be a 3-character ISO code (e.g., EUR).");
        }

        return Result.ok<Dinheiro>(new Dinheiro({
            value: value,
            moeda: moeda.toUpperCase()
        }));
    }

    /**
     * Adds another Dinheiro instance to the current one.
     * Currencies must match to perform the operation.
     */
    public add(other: Dinheiro): Result<Dinheiro> {
        if (this.moeda !== other.moeda) {
            return Result.fail<Dinheiro>(`Cannot add different currencies: ${this.moeda} and ${other.moeda}`);
        }

        return Dinheiro.create(this.value + other.value, this.moeda);
    }

    /**
     * Subtracts another Dinheiro instance from the current one.
     * Currencies must match to perform the operation.
     */
    public subtract(other: Dinheiro): Result<Dinheiro> {
        if (this.moeda !== other.moeda) {
            return Result.fail<Dinheiro>(`Cannot subtract different currencies: ${this.moeda} and ${other.moeda}`);
        }

        return Dinheiro.create(this.value - other.value, this.moeda);
    }
}