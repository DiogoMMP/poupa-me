import {AggregateRoot} from '../../../core/domain/AggregateRoot.js';
import type {UniqueEntityID} from '../../../core/domain/UniqueEntityID.js';
import type {Nome} from '../../Shared/ValueObjects/Nome.js';
import type {Dinheiro} from '../../Shared/ValueObjects/Dinheiro.js';
import {Result} from '../../../core/logic/Result.js';
import {Guard} from '../../../core/logic/Guard.js';

/**
 * Props da DespesaRecorrente
 */
interface DespesaRecorrenteProps {
    userId: UniqueEntityID;
    nome: Nome;
    valor: Dinheiro;
    diaDoMes: number; // 1-31
    categoriaId: UniqueEntityID;
    contaOrigemId: UniqueEntityID;      // De onde sai o dinheiro (Saldo Real)
    contaDestinoId: UniqueEntityID;     // Para onde vai (Conta de Despesas Mensais)
    ultimoProcessamento: Date | null;
    ativo: boolean;
}

/**
 * Aggregate root representando uma Despesa Recorrente (ex: Netflix, Spotify).
 * Gera automaticamente transações mensais quando o dia do mês chega.
 */
export class DespesaRecorrente extends AggregateRoot<DespesaRecorrenteProps> {

    get userId(): UniqueEntityID {
        return this.props.userId;
    }

    get nome(): Nome {
        return this.props.nome;
    }

    get valor(): Dinheiro {
        return this.props.valor;
    }

    get diaDoMes(): number {
        return this.props.diaDoMes;
    }

    get categoriaId(): UniqueEntityID {
        return this.props.categoriaId;
    }

    get contaOrigemId(): UniqueEntityID {
        return this.props.contaOrigemId;
    }

    get contaDestinoId(): UniqueEntityID {
        return this.props.contaDestinoId;
    }

    get ultimoProcessamento(): Date | null {
        return this.props.ultimoProcessamento;
    }

    get ativo(): boolean {
        return this.props.ativo;
    }

    private constructor(props: DespesaRecorrenteProps, id?: UniqueEntityID) {
        super(props, id);
    }

    /**
     * Marca esta despesa recorrente como processada numa determinada data
     */
    public marcarComoProcessada(data: Date): void {
        this.props.ultimoProcessamento = data;
    }

    /**
     * Ativa esta despesa recorrente
     */
    public ativar(): void {
        this.props.ativo = true;
    }

    /**
     * Desativa esta despesa recorrente
     */
    public desativar(): void {
        this.props.ativo = false;
    }

    /**
     * Factory method para criar uma DespesaRecorrente
     */
    public static create(props: DespesaRecorrenteProps, id?: UniqueEntityID): Result<DespesaRecorrente> {
        const guardedProps = [
            {argument: props.userId, argumentName: 'userId'},
            {argument: props.nome, argumentName: 'nome'},
            {argument: props.valor, argumentName: 'valor'},
            {argument: props.diaDoMes, argumentName: 'diaDoMes'},
            {argument: props.categoriaId, argumentName: 'categoriaId'},
            {argument: props.contaOrigemId, argumentName: 'contaOrigemId'},
            {argument: props.contaDestinoId, argumentName: 'contaDestinoId'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<DespesaRecorrente>(guardResult.message || 'Invalid DespesaRecorrente props');
        }

        // Validate diaDoMes
        if (props.diaDoMes < 1 || props.diaDoMes > 31) {
            return Result.fail<DespesaRecorrente>('diaDoMes must be between 1 and 31');
        }

        // Default values
        const defaultProps: DespesaRecorrenteProps = {
            ...props,
            ultimoProcessamento: props.ultimoProcessamento ?? null,
            ativo: props.ativo ?? true
        };

        return Result.ok<DespesaRecorrente>(new DespesaRecorrente(defaultProps, id));
    }
}


