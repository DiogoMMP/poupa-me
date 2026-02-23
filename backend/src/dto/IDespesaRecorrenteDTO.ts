import type { IDinheiroProps } from './ITransacaoDTO.js';

/**
 * DTO para DespesaRecorrente (response)
 */
export interface IDespesaRecorrenteDTO {
    id: string;
    userId: string;
    nome: string;
    valor: IDinheiroProps;
    diaDoMes: number;
    categoriaId: string;
    contaOrigemId: string;
    contaDestinoId: string;
    contaPoupancaId?: string;
    tipo: 'Despesa Mensal' | 'Poupança';
    ultimoProcessamento: Date | null;
    ativo: boolean;
}

export interface ICreateDespesaRecorrenteDTO {
    userId?: string;
    nome: string;
    valor: IDinheiroProps;
    diaDoMes: number;
    categoriaId: string;
    contaOrigemId: string;
    contaDestinoId: string;
    contaPoupancaId?: string;
    tipo?: 'Despesa Mensal' | 'Poupança';
    ativo?: boolean;
}

export interface IUpdateDespesaRecorrenteDTO {
    nome?: string;
    valor?: IDinheiroProps;
    diaDoMes?: number;
    categoriaId?: string;
    contaOrigemId?: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
    tipo?: 'Despesa Mensal' | 'Poupança';
    ativo?: boolean;
}

