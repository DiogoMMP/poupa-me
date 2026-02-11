import type {IDinheiroProps} from "./ITransacaoDTO.js";
import type {IDataProps} from "./ITransacaoDTO.js";

export interface IPeriodoProps {
    inicio: IDataProps;
    fecho: IDataProps;
}

export interface ICartaoCreditoDTO {
    id: string;
    userId: string;
    nome: string;
    icon: string;
    limiteCredito: IDinheiroProps;
    saldoUtilizado: IDinheiroProps;
    periodo: IPeriodoProps;
    contaPagamentoId: string;
}

export interface ICartaoCreditoInputDTO {
    nome: string;
    icon: string;
    userId?: string;
    limiteCredito: IDinheiroProps;
    saldoUtilizado?: IDinheiroProps; // optional initial balance; defaults to zero
    periodo: IPeriodoProps;
    contaPagamentoId: string;
}

export interface ICartaoCreditoUpdateDTO {
    nome?: string;
    icon?: string;
    limiteCredito?: IDinheiroProps;
    periodo?: IPeriodoProps;
    contaPagamentoId?: string;
}