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
    contaDestinoId: string;
    contaPoupancaId?: string;
    tipo: 'Despesa Mensal' | 'Poupança';
    ultimoProcessamento: Date | null;
    ativo: boolean;
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
    contaDestinoId: string;
    contaPoupancaId?: string;
    tipo?: 'Despesa Mensal' | 'Poupança';
    ativo?: boolean;
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
    tipo?: 'Despesa Mensal' | 'Poupança';
    ativo?: boolean;
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

