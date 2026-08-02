import { ICategoriaDTO } from './ICategoriaDTO.js';
import { IDataDTO } from './shared/IDataDTO.js';
import type { IDinheiroDTO } from './shared/IDinheiroDTO.js';
import { IEntityReferenceDTO } from './shared/IEntityReferenceDTO.js';

/**
 * DTO for Recurring Expense (response)
 */
export interface IDespesaRecorrenteDTO {
    id: string;
    user?: IEntityReferenceDTO;
    nome: string;
    icon: string;
    valor?: IDinheiroDTO;
    diaDoMes?: number;
    categoria: ICategoriaDTO;
    contaOrigem: IEntityReferenceDTO;
    contaDestino?: IEntityReferenceDTO;
    contaPoupanca?: IEntityReferenceDTO;
    tipo: string;
    ultimoProcessamento: Date | null;
    ativo: boolean;
    imediata: boolean;
    diaDaSemana?: number;
    mes?: number;
}

/**
 * Payload to create a Recurring Expense
 */
export interface ICreateDespesaRecorrenteDTO {
    userId?: string;
    nome: string;
    icon: string;
    valor?: IDinheiroDTO;
    diaDoMes?: number;
    categoriaId: string;
    contaOrigemId: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
    tipo?: string;
    ativo?: boolean;
    imediata?: boolean;
    diaDaSemana?: number;
    mes?: number;
}

/**
 * Payload to update a Recurring Expense
 */
export interface IUpdateDespesaRecorrenteDTO {
    nome?: string;
    icon?: string;
    valor?: IDinheiroDTO;
    diaDoMes?: number;
    categoriaId?: string;
    contaOrigemId?: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
    tipo?: string;
    ativo?: boolean;
    imediata?: boolean;
    diaDaSemana?: number;
    mes?: number;
}

/**
 * Payload to manually generate a pending transaction for a sem-valor recurring expense.
 * The rule itself is NOT updated — valor/data are used only for this one transaction.
 */
export interface IGerarTransacaoSemValorDTO {
    valor: IDinheiroDTO;
    /** Full date for the transaction */
    data: IDataDTO;
}

