import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Guard } from "../../../core/logic/Guard.js";
import { Result } from "../../../core/logic/Result.js";

/**
 * Value Object representing a name.
 */
interface NomeProps {
  value: string;
}

/**
 * Maximum length for the name value.
 */
const MAX_LENGTH = 50;

/**
 * Value Object class for Nome, ensuring that the name is valid according to defined rules.
 */
export class Nome extends ValueObject<NomeProps> {

  /**
   * Getter for the name value.
   * @returns The name value as a string.
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Private constructor to enforce the use of the static create method for instantiation.
   * @param props The properties required to create a Nome instance.
   * @private
   */
  private constructor(props: NomeProps) {
    super(props);
  }

  /**
   * Static factory method to create a Nome instance. It validates the input value and returns a Result object indicating success or failure.
   * @param value The name value to be validated and used for creating a Nome instance.
   * @returns A Result object containing either a Nome instance or an error message.
   */
  public static create(value: string): Result<Nome> {
    const guardResult = Guard.againstNullOrUndefined(value, "Nome");
    if (!guardResult.succeeded) {
      return Result.fail<Nome>(guardResult.message);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Result.fail<Nome>("Nome cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      return Result.fail<Nome>(`Nome must not exceed ${MAX_LENGTH} characters`);
    }

    return Result.ok<Nome>(new Nome({ value: trimmed }));
  }
}
