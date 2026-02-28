import {AggregateRoot} from '../../../core/domain/AggregateRoot.js';
import type {UniqueEntityID} from '../../../core/domain/UniqueEntityID.js';
import type {Nome} from '../../Shared/ValueObjects/Nome.js';
import type {Dinheiro} from '../../Shared/ValueObjects/Dinheiro.js';
import {Result} from '../../../core/logic/Result.js';
import {Guard} from '../../../core/logic/Guard.js';

/**
 * Properties for Recurring Expense
 */
interface DespesaRecorrenteProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: string;
    valor?: Dinheiro;       // Required together with diaDoMes
    diaDoMes?: number;      // 1-31 — Required together with valor
    categoriaId: UniqueEntityID;
    contaOrigemId: UniqueEntityID;      // Account from which money leaves (real balance)
    contaDestinoId: UniqueEntityID;     // Account where money goes (monthly expenses account)
    contaPoupancaId?: UniqueEntityID;   // Only for "Poupança" recurrence type
    tipo?: 'Despesa Mensal' | 'Poupança'; // default: 'Despesa Mensal'
    ultimoProcessamento: Date | null;
    ativo: boolean;
}

/**
 * Aggregate root representing a Recurring Expense (e.g. Netflix, Spotify).
 * Automatically generates monthly transactions when the scheduled day arrives.
 */
export class DespesaRecorrente extends AggregateRoot<DespesaRecorrenteProps> {

    get userId(): UniqueEntityID {
        return this.props.userId;
    }

    get nome(): Nome {
        return this.props.nome;
    }

    get icon(): string {
        return this.props.icon;
    }

    get valor(): Dinheiro | undefined {
        return this.props.valor;
    }

    get diaDoMes(): number | undefined {
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

    get contaPoupancaId(): UniqueEntityID | undefined {
        return this.props.contaPoupancaId;
    }

    get tipo(): 'Despesa Mensal' | 'Poupança' {
        return this.props.tipo ?? 'Despesa Mensal';
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
     * Marks this recurring expense as processed on a specific date
     */
    public marcarComoProcessada(data: Date): void {
        this.props.ultimoProcessamento = data;
    }

    /**
     * Activates this recurring expense
     */
    public ativar(): void {
        this.props.ativo = true;
    }

    /**
     * Deactivates this recurring expense
     */
    public desativar(): void {
        this.props.ativo = false;
    }

    /**
     * Factory method to create a Recurring Expense
     */
    public static create(props: DespesaRecorrenteProps, id?: UniqueEntityID): Result<DespesaRecorrente> {
        const guardedProps = [
            {argument: props.userId, argumentName: 'userId'},
            {argument: props.nome, argumentName: 'nome'},
            {argument: props.icon, argumentName: 'icon'},
            {argument: props.categoriaId, argumentName: 'categoriaId'},
            {argument: props.contaOrigemId, argumentName: 'contaOrigemId'},
            {argument: props.contaDestinoId, argumentName: 'contaDestinoId'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<DespesaRecorrente>(guardResult.message || 'Invalid DespesaRecorrente props');
        }

        // valor e diaDoMes devem existir os 2 ou nenhum
        const hasValor = props.valor !== undefined && props.valor !== null;
        const hasDiaDoMes = props.diaDoMes !== undefined && props.diaDoMes !== null;
        if (hasValor !== hasDiaDoMes) {
            return Result.fail<DespesaRecorrente>('valor e diaDoMes devem ser fornecidos em conjunto ou nenhum dos dois');
        }

        // Validate diaDoMes when provided
        if (hasDiaDoMes && (props.diaDoMes! < 1 || props.diaDoMes! > 31)) {
            return Result.fail<DespesaRecorrente>('diaDoMes must be between 1 and 31');
        }

        // Poupança requires contaPoupancaId
        if (props.tipo === 'Poupança' && !props.contaPoupancaId) {
            return Result.fail<DespesaRecorrente>('contaPoupancaId is required for Poupança recurrence');
        }

        // Default values
        const defaultProps: DespesaRecorrenteProps = {
            ...props,
            tipo: props.tipo ?? 'Despesa Mensal',
            ultimoProcessamento: props.ultimoProcessamento ?? null,
            ativo: props.ativo ?? true
        };

        return Result.ok<DespesaRecorrente>(new DespesaRecorrente(defaultProps, id));
    }
}


