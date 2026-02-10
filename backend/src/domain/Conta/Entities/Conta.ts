import {AggregateRoot} from "../../../core/domain/AggregateRoot.js";
import {UniqueEntityID} from "../../../core/domain/UniqueEntityID.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";
import {Nome} from "../../Shared/ValueObjects/Nome.js";
import {Icon} from "../../Shared/ValueObjects/Icon.js";
import {Dinheiro} from "../../Shared/ValueObjects/Dinheiro.js";
import {Transacao} from "../../Transacao/Entities/Transacao.js";

/**
 * Interface representing the properties of a Conta entity
 */
interface ContaProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: Icon;
    saldo: Dinheiro; // Current balance snapshot
    transacoes: Transacao[];
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
     * Gets the current saldo (balance) of the Conta. This is a snapshot that gets updated with each transaction.
     */
    get saldo(): Dinheiro {
        return this.props.saldo;
    }

    /**
     * Gets the list of transacoes (transactions) associated with this Conta. This is the source of truth for all
     * financial activity, while saldo is a derived snapshot that gets updated as transactions are registered.
     */
    get transacoes(): Transacao[] {
        return this.props.transacoes;
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
     * Processes a transaction and updates the snapshot balance.
     * @param transacao - The transaction to register
     */
    public registarTransacao(transacao: Transacao): Result<void> {
        const isPositiveImpact = transacao.tipo.value === "Entrada" || transacao.tipo.value === "Reembolso";

        // We update the balance based on the transaction type
        const updatedSaldoResult = isPositiveImpact
            ? this.props.saldo.add(transacao.valor)
            : this.props.saldo.subtract(transacao.valor);

        if (updatedSaldoResult.isFailure) {
            return Result.fail<void>(updatedSaldoResult.errorValue() as unknown as string);
        }

        this.props.saldo = updatedSaldoResult.getValue();
        this.props.transacoes.push(transacao);

        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a previously registered transaction from this account.
     * It will attempt to remove the transaction from the transacoes list and update the saldo accordingly.
     * If the transaction is not found, it still attempts to reverse the balance change.
     */
    public reverterTransacao(transacao: Transacao): Result<void> {
        const wasPositiveImpact = transacao.tipo.value === "Entrada" || transacao.tipo.value === "Reembolso";

        // To revert, invert the operation that was applied when registering
        const updatedSaldoResult = wasPositiveImpact
            ? this.props.saldo.subtract(transacao.valor)
            : this.props.saldo.add(transacao.valor);

        if (updatedSaldoResult.isFailure) {
            return Result.fail<void>(updatedSaldoResult.errorValue() as unknown as string);
        }

        this.props.saldo = updatedSaldoResult.getValue();

        // Remove the transaction from the list if present (by domain id equality)
        const idx = this.props.transacoes.findIndex(t => t.id.toString() === transacao.id.toString());
        if (idx >= 0) {
            this.props.transacoes.splice(idx, 1);
        }

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
            {argument: props.saldo, argumentName: 'saldo'},
            {argument: props.transacoes, argumentName: 'transacoes'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<Conta>(guardResult.message || 'Invalid Conta properties');
        }

        return Result.ok<Conta>(new Conta(props, id));
    }
}