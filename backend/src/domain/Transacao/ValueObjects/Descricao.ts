import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Guard } from "../../../core/logic/Guard.js";
import { Result } from "../../../core/logic/Result.js";

/**
 * Value Object representing a transaction description.
 */
interface DescricaoProps {
  value: string;
}

const MAX_LENGTH = 500;

/**
 * Value Object class for Descricao, ensuring that the description is valid according to defined rules.
 */
export class Descricao extends ValueObject<DescricaoProps> {
  /**
   * Getter for the description value.
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Private constructor to enforce the use of the static create method for instantiation.
   */
  private constructor(props: DescricaoProps) {
    super(props);
  }

  /**
   * Static factory method to create a Descricao instance. It validates the input value and returns a Result object indicating success or failure.
   * @param value The description value to be validated and used for creating a Descricao instance.
   */
  public static create(value: string): Result<Descricao> {
    const guardResult = Guard.againstNullOrUndefined(value, "Descricao");
    if (!guardResult.succeeded) {
      return Result.fail<Descricao>(guardResult.message);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Result.fail<Descricao>("Descricao cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      return Result.fail<Descricao>(`Descricao must not exceed ${MAX_LENGTH} characters`);
    }

    return Result.ok<Descricao>(new Descricao({ value: trimmed }));
  }
}
