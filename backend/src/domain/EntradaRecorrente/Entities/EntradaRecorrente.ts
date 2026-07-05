import {AggregateRoot} from '../../../core/domain/AggregateRoot.js';
import type {UniqueEntityID} from '../../../core/domain/UniqueEntityID.js';
import type {Nome} from '../../Shared/ValueObjects/Nome.js';
import type {Dinheiro} from '../../Shared/ValueObjects/Dinheiro.js';
import {Result} from '../../../core/logic/Result.js';
import {Guard} from '../../../core/logic/Guard.js';
import {Tipo} from "../../Shared/ValueObjects/Tipo.js";

/**
 * Properties for Recurring Entry
 */
interface EntradaRecorrenteProps {
    userId: UniqueEntityID;
    nome: Nome;
    icon: string;
    valor?: Dinheiro;                       // Optional when dia is not defined
    diaDoMes?: number;                      // 1-31 — Requires valor when provided
    categoriaId: UniqueEntityID;
    contaDestinoId: UniqueEntityID;         // Account
    contaIntermediaId?: UniqueEntityID;     // Optional when imediata=true
    tipo?: Tipo;                            // default: 'Entrada Mensal'
    ultimoProcessamento: Date | null;
    ativo: boolean;
    imediata: boolean;
    diaDaSemana?: number;                   // 1-7
    mes?: number;                           // 1-12
}

/**
 * Aggregate root representing a Recurring Entry.
 * Automatically generates monthly transactions when the scheduled day arrives.
 */
export class EntradaRecorrente extends AggregateRoot<EntradaRecorrenteProps> {

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

    get contaDestinoId(): UniqueEntityID {
        return this.props.contaDestinoId;
    }

    get contaIntermediaId(): UniqueEntityID | undefined {
        return this.props.contaIntermediaId;
    }

    get tipo(): Tipo {
        return this.props.tipo ?? Tipo.create("Entrada Mensal").getValue();
    }

    get ultimoProcessamento(): Date | null {
        return this.props.ultimoProcessamento;
    }

    get ativo(): boolean {
        return this.props.ativo;
    }

    get imediata(): boolean {
        return this.props.imediata;
    }

    get diaDaSemana(): number | undefined {
        return this.props.diaDaSemana;
    }

    get mes(): number | undefined {
        return this.props.mes;
    }

    private constructor(props: EntradaRecorrenteProps, id?: UniqueEntityID) {
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
    public static create(props: EntradaRecorrenteProps, id?: UniqueEntityID): Result<EntradaRecorrente> {
        const guardedProps = [
            {argument: props.userId, argumentName: 'userId'},
            {argument: props.nome, argumentName: 'nome'},
            {argument: props.icon, argumentName: 'icon'},
            {argument: props.categoriaId, argumentName: 'categoriaId'},
            {argument: props.contaDestinoId, argumentName: 'contaDestinoId'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            return Result.fail<EntradaRecorrente>(guardResult.message || 'Invalid EntradaRecorrente props');
        }

        if (!props.imediata) {
            if (!props.contaIntermediaId) {
                return Result.fail<EntradaRecorrente>('contaIntermediaId is required when imediata is false');
            }
        }

        const tipoValue = props.tipo?.value ?? "Entrada Mensal";

        // Variáveis para as verificações
        const hasValor = props.valor !== undefined && props.valor !== null;
        const hasDiaDaSemana = props.diaDaSemana !== undefined && props.diaDaSemana !== null;
        const hasDiaDoMes = props.diaDoMes !== undefined && props.diaDoMes !== null;
        const hasMes = props.mes !== undefined && props.mes !== null;

        // Entrada Semanal
        if (tipoValue === "Entrada Semanal" && hasDiaDaSemana && !hasValor) {
            return Result.fail<EntradaRecorrente>('valor is required when diaDaSemana is provided');
        }

        // Entrada Mensal
        if (tipoValue === 'Entrada Mensal' && hasDiaDoMes && !hasValor) {
            return Result.fail<EntradaRecorrente>('valor is required when diaDoMes is provided');
        }

        // Entrada Anual
        if (tipoValue === 'Entrada Anual') {
            const hasAgendamento = hasMes || hasDiaDoMes;
            if (hasAgendamento && !(hasMes && hasDiaDoMes)) {
                return Result.fail<EntradaRecorrente>('mes and diaDoMes must be provided together');
            }
            if (hasAgendamento && !hasValor) {
                return Result.fail<EntradaRecorrente>('valor is required when mes/diaDoMes are provided');
            }
        }

        // Validate diaDaSemana when provided
        if (hasDiaDaSemana && (props.diaDaSemana! < 1 || props.diaDaSemana! > 7)) {
            return Result.fail<EntradaRecorrente>('diaDaSemana must be between 1 and 7');
        }

        // Validate diaDoMes when provided
        if (hasDiaDoMes && (props.diaDoMes! < 1 || props.diaDoMes! > 31)) {
            return Result.fail<EntradaRecorrente>('diaDoMes must be between 1 and 31');
        }

        // Validate mes when provided
        if (hasMes && (props.mes! < 1 || props.mes! > 12)) {
            return Result.fail<EntradaRecorrente>('mes must be between 1 and 12');
        }

        // Default values
        const defaultProps: EntradaRecorrenteProps = {
            ...props,
            tipo: props.tipo ?? Tipo.create("Entrada Mensal").getValue(),
            ultimoProcessamento: props.ultimoProcessamento ?? null,
            ativo: props.ativo ?? true,
            imediata: props.imediata ?? false,
        };

        return Result.ok<EntradaRecorrente>(new EntradaRecorrente(defaultProps, id));
    }
}
