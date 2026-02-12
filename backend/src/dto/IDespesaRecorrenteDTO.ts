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
    ultimoProcessamento: Date | null;
    ativo: boolean;
}

/**
 * DTO para criar DespesaRecorrente
 */
export interface ICreateDespesaRecorrenteDTO {
    userId?: string; // Optional - filled from authenticated user
    nome: string;
    valor: IDinheiroProps;
    diaDoMes: number;
    categoriaId: string;
    contaOrigemId: string;
    contaDestinoId: string;
    ativo?: boolean;
}

/**
 * DTO para atualizar DespesaRecorrente
 */
export interface IUpdateDespesaRecorrenteDTO {
    nome?: string;
    valor?: IDinheiroProps;
    diaDoMes?: number;
    categoriaId?: string;
    contaOrigemId?: string;
    contaDestinoId?: string;
    ativo?: boolean;
}

