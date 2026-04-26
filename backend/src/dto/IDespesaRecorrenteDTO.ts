import type { IDinheiroProps } from './ITransacaoDTO.js';

/**
 * DTO for Recurring Expense (response)
 */
export interface IDespesaRecorrenteDTO {
    id: string;
    userId: string;
    nome: string;
    icon: string;
    valor?: IDinheiroProps;
    diaDoMes?: number;
    categoriaId: string;
    contaOrigemId: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
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
    valor?: IDinheiroProps;
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
    valor?: IDinheiroProps;
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
    valor: IDinheiroProps;
    /** Full date for the transaction */
    data: {
        dia: number;
        mes: number;
        ano: number;
    };
}

