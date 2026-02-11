import {AggregateRoot} from "../../../core/domain/AggregateRoot.js";
import {UniqueEntityID} from "../../../core/domain/UniqueEntityID.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";
import {Nome} from "../../Shared/ValueObjects/Nome.js";
import {Icon} from "../../Shared/ValueObjects/Icon.js";
import {Dinheiro} from "../../Shared/ValueObjects/Dinheiro.js";

/**
 * Interface representing the properties of a Conta entity
 */
interface ContaProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: Icon;
    saldo: Dinheiro; // Current balance snapshot
}

/**
 * Aggregate root representing a Conta in the system
 */
export class Conta extends AggregateRoot<ContaProps> {

    /**
     * Gets the userId associated with this Conta
     */
    get userId(): UniqueEntityID {
        return this.props.userId;
    }

    /**
     * Gets the nome of the Conta
     */
    get nome(): Nome {
        return this.props.nome;
    }

    /**
     * Gets the icon of the Conta
     */
    get icon(): Icon {
        return this.props.icon;
    }

    /**
     * Gets the current saldo (balance) of the Conta.
     */
    get saldo(): Dinheiro {
        return this.props.saldo;
    }


    /**
     * Private constructor to enforce the use of the static create method for instantiation. This ensures that all
     * Conta instances are created with valid properties.
     * @param props - The properties of the Conta entity
     * @param id - Optional unique identifier for the Conta entity
     * @private
     */
    private constructor(props: ContaProps, id?: UniqueEntityID) {
        super(props, id);
    }

    /**
     * Updates the account balance by adding the specified amount.
     * @param valor - The amount to add to the balance
     */
    public adicionarSaldo(valor: Dinheiro): Result<void> {
        const updatedSaldoResult = this.props.saldo.add(valor);
        if (updatedSaldoResult.isFailure) {
            return Result.fail<void>(updatedSaldoResult.errorValue() as unknown as string);
        }
        this.props.saldo = updatedSaldoResult.getValue();
        return Result.ok<void>();
    }

    /**
     * Updates the account balance by subtracting the specified amount.
     * @param valor - The amount to subtract from the balance
     */
    public subtrairSaldo(valor: Dinheiro): Result<void> {
        const updatedSaldoResult = this.props.saldo.subtract(valor);
        if (updatedSaldoResult.isFailure) {
            return Result.fail<void>(updatedSaldoResult.errorValue() as unknown as string);
        }
        this.props.saldo = updatedSaldoResult.getValue();

        return Result.ok<void>();
    }

    /**
     * Static factory method to create a new instance of Conta with validation. This method ensures that all required
     * properties are provided and valid before creating a Conta instance.
     * @param props - The properties required to create a Conta entity
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @returns A Result object containing either a valid Conta instance or an error message
     */
    public static create(props: ContaProps, id?: UniqueEntityID): Result<Conta> {
        const guardedProps = [
            {argument: props.userId, argumentName: 'userId'},
            {argument: props.nome, argumentName: 'nome'},
            {argument: props.icon, argumentName: 'icon'},
            {argument: props.saldo, argumentName: 'saldo'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<Conta>(guardResult.message || 'Invalid Conta properties');
        }

        return Result.ok<Conta>(new Conta(props, id));
    }
}