import { ValueObject } from '../../../core/domain/ValueObject.js';
import { Result } from '../../../core/logic/Result.js';
import { Guard } from '../../../core/logic/Guard.js';
import { Data } from '../../Shared/ValueObjects/Data.js';

interface PeriodoProps {
    inicio: Data; // period start date
    fecho: Data;  // period close date
}

/**
 * Value Object representing a billing period for a credit card using full dates.
 */
export class Periodo extends ValueObject<PeriodoProps> {
    private constructor (props: PeriodoProps) {
        super(props);
    }

    get inicio (): Data {
        return this.props.inicio;
    }

    get fecho (): Data {
        return this.props.fecho;
    }

    /**
     * Create a Periodo from two Data value objects.
     * @param inicio - start date
     * @param fecho - close date
     */
    public static create (inicio: Data, fecho: Data): Result<Periodo> {
        const guardResult = Guard.againstNullOrUndefinedBulk([
            { argument: inicio, argumentName: 'inicio' },
            { argument: fecho, argumentName: 'fecho' }
        ]);

        if (!guardResult.succeeded) {
            return Result.fail<Periodo>(guardResult.message || 'Invalid Periodo properties');
        }

        // No further validation here (dates validity is handled by Data VO)
        return Result.ok<Periodo>(new Periodo({ inicio, fecho }));
    }
}
