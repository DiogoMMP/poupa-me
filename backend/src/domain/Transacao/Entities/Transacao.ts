import {AggregateRoot} from "../../../core/domain/AggregateRoot.js";
import {Descricao} from "../ValueObjects/Descricao.js";
import {Data} from "../ValueObjects/Data.js";
import {Dinheiro} from "../../Shared/ValueObjects/Dinheiro.js";
import {Tipo} from "../ValueObjects/Tipo.js";
import {Status} from "../ValueObjects/Status.js";
import {Categoria} from "../../Categoria/Entities/Categoria.js";
import {Reembolso} from "../ValueObjects/Reembolso.js";
import {UniqueEntityID} from "../../../core/domain/UniqueEntityID.js";
import {Guard} from "../../../core/logic/Guard.js";
import {Result} from "../../../core/logic/Result.js";

interface TransacaoProps {
    descricao: Descricao;
    data: Data;
    valor: Dinheiro;
    tipo: Tipo;
    categoria: Categoria;
    status: Status;
    reembolso?: Reembolso;
}

export class Transacao extends AggregateRoot<TransacaoProps> {
    get descricao(): Descricao {
        return this.props.descricao;
    }

    get data(): Data {
        return this.props.data;
    }

    get valor(): Dinheiro {
        return this.props.valor;
    }

    get tipo(): Tipo {
        return this.props.tipo;
    }

    get categoria(): Categoria {
        return this.props.categoria;
    }

    get status(): Status {
        return this.props.status;
    }

    get reembolso(): Reembolso | undefined {
        return this.props.reembolso;
    }

    private constructor(props: TransacaoProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: TransacaoProps, id?: UniqueEntityID): Result<Transacao> {
        const guardedProps = [
            {argument: props.descricao, argumentName: 'descricao'},
            {argument: props.data, argumentName: 'data'},
            {argument: props.valor, argumentName: 'valor'},
            {argument: props.tipo, argumentName: 'tipo'},
            {argument: props.categoria, argumentName: 'categoria'},
            {argument: props.status, argumentName: 'status'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<Transacao>(guardResult.message || 'Invalid Transacao properties');
        }

        const transacao = new Transacao(props, id);
        return Result.ok<Transacao>(transacao);
    }

    /**
     * Specialized factory for a common Recipe/Income transaction
     * @param props - The properties required to create a Transacao entity, excluding 'tipo' and 'status' which are set by default for this factory
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @return A Result object containing either a valid Transacao instance or an error message if validation fails
     */
    public static createEntrada(
        props: Omit<TransacaoProps, 'tipo' | 'reembolso' | 'status'>,
        id?: UniqueEntityID
    ): Result<Transacao> {
        // We force the 'Entrada' type and 'Completed' status by default for simple recipes
        const typeResult = Tipo.create("Entrada");
        const statusResult = Status.create("Concluído");

        if (typeResult.isFailure) return Result.fail<Transacao>(typeResult.errorValue() as unknown as string);

        return Transacao.create({
            ...props,
            tipo: typeResult.getValue(),
            status: statusResult.getValue()
        }, id);

    }

    /**
     * Specialized factory for a common Expense transaction
     * @param props - The properties required to create a Transacao entity, excluding 'tipo' and 'status' which are set by default for this factory
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @return A Result object containing either a valid Transacao instance or an error message if validation fails
     */
    public static createSaida(
        props: Omit<TransacaoProps, 'tipo' | 'reembolso' | 'status'>,
        id?: UniqueEntityID
    ): Result<Transacao> {
        // We force the 'Saída' type and 'Completed' status by default for simple expenses
        const typeResult = Tipo.create("Saída");
        const statusResult = Status.create("Concluído");

        if (typeResult.isFailure) return Result.fail<Transacao>(typeResult.errorValue() as unknown as string);

        return Transacao.create({
            ...props,
            tipo: typeResult.getValue(),
            status: statusResult.getValue()
        }, id);
    }

    /**
     * Specialized factory for creating a Refund transaction based on an original transaction ID
     * @param props - The properties required to create a Transacao entity, excluding 'tipo' and 'reembolso' which are set by default for this factory
     * @param originalId - The UniqueEntityID of the original transaction that is being refunded
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @return A Result object containing either a valid Transacao instance or an error message if validation fails
     */
    public static createReembolso(
        props: Omit<TransacaoProps, 'tipo' | 'reembolso' | 'status'>,
        originalId: UniqueEntityID,
        id?: UniqueEntityID
    ): Result<Transacao> {
        const typeResult = Tipo.create("Reembolso");
        const refundResult = Reembolso.create(originalId);
        const statusResult = Status.create("Pendente");

        const combine = Result.combine([typeResult, refundResult, statusResult]);
        if (combine.isFailure) return Result.fail<Transacao>(combine.errorValue() as string);

        return Transacao.create({
            ...props,
            tipo: typeResult.getValue(),
            reembolso: refundResult.getValue(),
            status: statusResult.getValue()
        }, id);
    }

    /**
     * Specialized factory for creating a Credit transaction, which is a type of expense that is pending until confirmed
     * @param props - The properties required to create a Transacao entity, excluding 'tipo' and 'status' which are set by default for this factory
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @return A Result object containing either a valid Transacao instance or an error message if validation fails
     */
    public static createCredito(
        props: Omit<TransacaoProps, 'tipo' | 'reembolso' | 'status'>,
        id?: UniqueEntityID
    ): Result<Transacao> {
        const typeResult = Tipo.create("Crédito");
        const statusResult = Status.create("Pendente");

        const combine = Result.combine([typeResult, statusResult]);
        if (combine.isFailure) return Result.fail<Transacao>(combine.errorValue() as string);

        return Transacao.create({
            ...props,
            tipo: typeResult.getValue(),
            status: statusResult.getValue()
        }, id);
    }

    /**
     * Specialized factory for creating a Monthly Expense transaction, which is a type of expense that is pending until confirmed
     * @param props - The properties required to create a Transacao entity, excluding 'tipo' and 'status' which are set by default for this factory
     * @param id - Optional UniqueEntityID to restore/preserve domain id from persistence
     * @return A Result object containing either a valid Transacao instance or an error message if validation fails
     */
    public static createDespesaMensal(
        props: Omit<TransacaoProps, 'tipo' | 'reembolso' | 'status'>,
        id?: UniqueEntityID
    ): Result<Transacao> {
        const typeResult = Tipo.create("Despesa Mensal");
        const statusResult = Status.create("Pendente");

        const combine = Result.combine([typeResult, statusResult]);
        if (combine.isFailure) return Result.fail<Transacao>(combine.errorValue() as string);

        return Transacao.create({
            ...props,
            tipo: typeResult.getValue(),
            status: statusResult.getValue()
        }, id);
    }
}