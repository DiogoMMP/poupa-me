import { ValueObject } from "../../../core/domain/ValueObject.js";
import { Guard } from "../../../core/logic/Guard.js";
import { Result } from "../../../core/logic/Result.js";

/**
 * Value Object representing an icon.
 */
interface IconProps {
  value: string;
}

/**
 * Maximum length for the icon value.
 */
const MAX_LENGTH = 50;

/**
 * Value Object class for Icon, ensuring that the icon is valid according to defined rules.
 */
export class Icon extends ValueObject<IconProps> {

  /**
   * Getter for the icon value.
   * @returns The icon value as a string.
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Private constructor to enforce the use of the static create method for instantiation.
   * @param props The properties required to create an Icon instance.
   * @private
   */
  private constructor(props: IconProps) {
    super(props);
  }

  /**
   * Static factory method to create an Icon instance. It validates the input value and returns a Result object indicating success or failure.
   * @param value The icon value to be validated and used for creating an Icon instance.
   * @returns A Result object containing either an Icon instance or an error message.
   */
  public static create(value: string): Result<Icon> {
    const guardResult = Guard.againstNullOrUndefined(value, "Icon");
    if (!guardResult.succeeded) {
      return Result.fail<Icon>(guardResult.message);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Result.fail<Icon>("Icon cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      return Result.fail<Icon>(`Icon must not exceed ${MAX_LENGTH} characters`);
    }

    return Result.ok<Icon>(new Icon({ value: trimmed }));
  }
}
