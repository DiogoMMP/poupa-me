import {UniqueEntityID} from "../../../core/domain/UniqueEntityID.js";
import {Nome} from "../../Shared/ValueObjects/Nome.js";
import {Icon} from "../../Shared/ValueObjects/Icon.js";
import {AggregateRoot} from "../../../core/domain/AggregateRoot.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";

/**
 * Interface representing the properties of a Banco entity
 */
interface BancoProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: Icon;
}

/**
 * Aggregate root representing a Banco (Bank) in the system.
 * Groups Contas and CartaoCredito entities by financial institution.
 */
export class Banco extends AggregateRoot<BancoProps>{

    /**
     * Gets the userId associated with this Banco
     */
    get userId(): UniqueEntityID {
        return this.props.userId;
    }

    /**
     * Gets the nome of the Banco
     */
    get nome(): Nome {
        return this.props.nome;
    }

    /**
     * Gets the icon of the Banco
     */
    get icon(): Icon {
        return this.props.icon;
    }

    /**
     * Private constructor to enforce the use of the static create method for instantiation.
     * @param props - The properties of the Banco entity
     * @param id - Optional unique identifier for the Banco entity
     * @private
     */
    private constructor(props: BancoProps, id?: UniqueEntityID) {
        super(props, id);
    }

    /**
     * Static factory method to create a new instance of Banco with validation.
     * @param props - The properties required to create a Banco entity
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @returns A Result object containing either a valid Banco instance or an error message
     */
    public static create(props: BancoProps, id?: UniqueEntityID): Result<Banco> {
        const guardedProps = [
            {argument: props.userId, argumentName: 'userId'},
            {argument: props.nome, argumentName: 'nome'},
            {argument: props.icon, argumentName: 'icon'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<Banco>(guardResult.message || 'Invalid Banco properties');
        }

        return Result.ok<Banco>(new Banco(props, id));
    }
}

