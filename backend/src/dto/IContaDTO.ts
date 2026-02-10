import type {IDinheiroProps, ITransacaoDTO} from "./ITransacaoDTO.js";

export interface IContaDTO {
    id: string;
    userId: string;
    nome: string;
    icon: string;
    saldo: IDinheiroProps;
    transacoes: ITransacaoDTO[];
}

export interface IContaInputDTO {
    nome: string;
    icon: string;
    userId?: string; // will be set by controller from authenticated user
    saldo?: IDinheiroProps; // optional initial balance; defaults to zero
}

export interface IContaUpdateDTO {
    nome?: string;
    icon?: string;
}