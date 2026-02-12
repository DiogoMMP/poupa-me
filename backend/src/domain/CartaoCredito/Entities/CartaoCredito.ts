import { Periodo } from '../ValueObjects/Periodo.js';
import { AggregateRoot } from '../../../core/domain/AggregateRoot.js';
import type { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';
import type { Nome } from '../../Shared/ValueObjects/Nome.js';
import type { Icon } from '../../Shared/ValueObjects/Icon.js';
import type { Dinheiro } from '../../Shared/ValueObjects/Dinheiro.js';
import { Result } from '../../../core/logic/Result.js';
import { Guard } from '../../../core/logic/Guard.js';

/**
 * Interface representing the properties of a CartaoCredito entity
 */
interface CartaoCreditoProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: Icon;
    limiteCredito: Dinheiro; // Maximum credit limit
    saldoUtilizado: Dinheiro; // Amount already used
    periodo: Periodo;
    contaPagamentoId?: UniqueEntityID | null; // optional, may be null
    bancoId?: string; // Optional: Domain ID of the associated Banco
}

/**
 * Aggregate root representing a CartaoCredito in the system. A CartaoCredito is associated with a Conta and has its own billing period.
 * The available limit is calculated as limiteCredito - saldoUtilizado.
 */
export class CartaoCredito extends AggregateRoot<CartaoCreditoProps> {

    /**
     * Gets the userId associated with this CartaoCredito
     */
    get userId (): UniqueEntityID {
        return this.props.userId;
    }

    /**
     * Gets the nome of the CartaoCredito
     */
    get nome (): Nome {
        return this.props.nome;
    }

    /**
     * Gets the icon of the CartaoCredito
     */
    get icon (): Icon {
        return this.props.icon;
    }

    /**
     * Gets the limiteCredito (total credit limit) of the CartaoCredito.
     */
    get limiteCredito (): Dinheiro {
        return this.props.limiteCredito;
    }

    /**
     * Gets the saldoUtilizado (amount already used) of the CartaoCredito.
     */
    get saldoUtilizado (): Dinheiro {
        return this.props.saldoUtilizado;
    }

    /**
     * Gets the billing period of the CartaoCredito. This defines the cycle for which transactions are grouped and limits are calculated.
     */
    get periodo (): Periodo {
        return this.props.periodo;
    }

    /**
     * Gets the ID of the Conta associated with this CartaoCredito. This is the account that will be charged for transactions made with this card.
     */
    get contaPagamentoId (): UniqueEntityID | null | undefined {
        return this.props.contaPagamentoId;
    }

    /**
     * Gets the bancoId (optional) associated with this CartaoCredito
     */
    get bancoId(): string | undefined {
        return this.props.bancoId;
    }

    /**
     * Private constructor to enforce the use of the static create method for instantiation. This ensures that all
     * necessary validations are performed before creating an instance of CartaoCredito.
     * @param props - The properties of the CartaoCredito entity
     * @param id - Optional unique identifier for the CartaoCredito entity
     * @private
     */
    private constructor (props: CartaoCreditoProps, id?: UniqueEntityID) {
        super(props, id);
    }

    /**
     * Static factory method to create a new CartaoCredito instance. This method performs necessary validations on the
     * input properties and ensures that all required fields are present and valid before creating an instance of CartaoCredito.
     * @param props - The properties required to create a CartaoCredito entity. Must include userId, nome, icon, limiteCredito,
     * saldoUtilizado, periodo, and contaPagamentoId.
     * @param id - Optional unique identifier for the CartaoCredito entity. If not provided, a new ID will be generated.
     * @returns A Result object containing the created CartaoCredito instance on success, or an error message on failure.
     */
    public static create (props: CartaoCreditoProps, id?: UniqueEntityID): Result<CartaoCredito> {
        const guardedProps = [
            { argument: props.userId, argumentName: 'userId' },
            { argument: props.nome, argumentName: 'nome' },
            { argument: props.icon, argumentName: 'icon' },
            { argument: props.limiteCredito, argumentName: 'limiteCredito' },
            { argument: props.saldoUtilizado, argumentName: 'saldoUtilizado' },
            { argument: props.periodo, argumentName: 'periodo' }
            // contaPagamentoId is optional and may be null
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) return Result.fail<CartaoCredito>(guardResult.message || 'Invalid CartaoCredito props');
        return Result.ok<CartaoCredito>(new CartaoCredito(props, id));
    }


    /**
     * Adds to the utilized balance when a credit transaction is made.
     * @param valor - The amount to add to the utilized balance
     */
    public adicionarUtilizacao(valor: Dinheiro): Result<void> {
        const updated = this.props.saldoUtilizado.add(valor);
        if (updated.isFailure) {
            return Result.fail<void>(updated.errorValue() as unknown as string);
        }

        this.props.saldoUtilizado = updated.getValue();
        return Result.ok<void>();
    }

    /**
     * Reduces the utilized balance when a refund or payment is made.
     * @param valor - The amount to subtract from the utilized balance
     */
    public reduzirUtilizacao(valor: Dinheiro): Result<void> {
        const updated = this.props.saldoUtilizado.subtract(valor);
        if (updated.isFailure) {
            return Result.fail<void>(updated.errorValue() as unknown as string);
        }
        this.props.saldoUtilizado = updated.getValue();
        return Result.ok<void>();
    }

    /**
     * Processes a payment to the CartaoCredito, reducing the utilized balance.
     * @param valorPago - The amount to pay towards the CartaoCredito. This reduces the saldoUtilizado.
     */
    public pagarCartao(valorPago: Dinheiro): Result<void> {
        return this.reduzirUtilizacao(valorPago);
    }

}
