import {ValueObject} from "../../../core/domain/ValueObject.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";

/**
 * Value Object representing a Date with day, month, and year.
 */
interface DataProps {
    day: number;
    month: number;
    year: number
}

/**
 * DateVO Value Object
 */
export class Data extends ValueObject<DataProps> {
    /**
     * Gets the day of the date.
     */
    get day(): number {
        return this.props.day
    }

    /**
     * Gets the month of the date.
     */
    get month(): number {
        return this.props.month
    }

    /**
     * Gets the year of the date.
     */
    get year(): number {
        return this.props.year
    }

    /**
     * Creates a new DateVO instance.
     * @param props - The properties for the DateVO.
     * @private
     */
    private constructor(props: DataProps) {
        super(props)
    }

    /**
     * Factory method to create a DateVO instance from day, month, and year.
     * @param day value of day
     * @param month value of month
     * @param year value of year
     * @param allowPastDates if true, allows dates before today (for createdAt timestamps)
     */
    public static createFromParts(day: number, month: number, year: number, allowPastDates = false): Result<Data> {
        const guardDay = Guard.againstNullOrUndefined(day, 'day');
        const guardMonth = Guard.againstNullOrUndefined(month, 'month');
        const guardYear = Guard.againstNullOrUndefined(year, 'year');

        if (!guardDay.succeeded) return Result.fail<Data>(guardDay.message);
        if (!guardMonth.succeeded) return Result.fail<Data>(guardMonth.message);
        if (!guardYear.succeeded) return Result.fail<Data>(guardYear.message);

        if (!Data.verifyDateLimitations(year, month, day, allowPastDates)) {
            return Result.fail<Data>(allowPastDates ? 'Invalid date' : 'Invalid date or date is in the future');
        }

        return Result.ok<Data>(new Data({day, month, year}));
    }

    /**
     * Factory method to create a DateVO instance from a string in DD-MM-YYYY format.
     * @param date string representing the date in DD-MM-YYYY format
     */
    public static parse(date: string): Result<Data> {
        const parsed = Data.tryParse(date);
        if (!parsed) return Result.fail<Data>('Invalid date format or date is in the future. Expected DD-MM-YYYY');
        return Result.ok<Data>(parsed);
    }

    /**
     * Attempts to parse a string into a DateVO.
     * @param date string representing the date in DD-MM-YYYY format
     */
    public static tryParse(date: string): Data | null {
        if (!date || date.trim().length === 0) return null;
        const parts = date.split('-');
        if (parts.length !== 3) return null;
        const [p0 = '', p1 = '', p2 = ''] = parts;
        if (p0.length !== 2 || p1.length !== 2 || p2.length !== 4) return null;
        if (![p0, p1, p2].every(p => /^[0-9]+$/.test(p))) return null;

        const day = Number(p0);
        const month = Number(p1);
        const year = Number(p2);

        if (!Data.verifyDateLimitations(year, month, day, false)) return null;

        return new Data({day, month, year});
    }

    /**
     * Verifies if the provided date parts form a valid date and is not before today (unless allowed).
     * @param year the value of year
     * @param month the value of month
     * @param day the value of day
     * @param allowPastDates if true, skip the "not before today" check
     * @private
     */
    private static verifyDateLimitations(year: number, month: number, day: number, allowPastDates = false): boolean {
        if (month < 1 || month > 12) return false;
        try {
            const maxDay = new Date(year, month, 0).getDate(); // day 0 => last day of previous month
            if (day < 1 || day > maxDay) return false;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            return false;
        }

        let parsed: globalThis.Date;
        try {
            parsed = new globalThis.Date(year, month - 1, day);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            return false;
        }

        // If past dates are allowed (e.g., for createdAt), just validate the date is valid
        if (allowPastDates) {
            return true;
        }

        // Otherwise, enforce that the date is today or in the past (reject future dates)
        const today = new globalThis.Date();
        const parsedDateOnly = new globalThis.Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        const todayOnly = new globalThis.Date(today.getFullYear(), today.getMonth(), today.getDate());

        // valid if parsedDate <= today
        return parsedDateOnly <= todayOnly;

    }

    /**
     * Returns the string representation of the date in DD-MM-YYYY format.
     */
    public override toString(): string {
        const dd = String(this.day).padStart(2, '0');
        const mm = String(this.month).padStart(2, '0');
        const yyyy = String(this.year).padStart(4, '0');
        return `${dd}-${mm}-${yyyy}`;
    }

    /**
     * Compares if this date is before another date.
     * @param other the other Data to compare with
     */
    public isBefore(other: Data): boolean {
        if (this.year < other.year) return true;
        if (this.year === other.year && this.month < other.month) return true;
        return this.year === other.year && this.month === other.month && this.day < other.day;

    }
}
