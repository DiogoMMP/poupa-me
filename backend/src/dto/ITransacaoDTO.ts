import type {ICategoriaDTO} from "./ICategoriaDTO.js";

export interface IData {
    dia: number;
    mes: number;
    ano: number;
}

export interface IDinheiroProps {
    valor: number;
    moeda: string;
}

export interface ITransacaoDTO {
    id: string;
    data: IData;
    descricao: string;
    valor: IDinheiroProps;
    tipo: string;
    categoria: ICategoriaDTO;
    status: string;
    reembolso?: string;
    contaId?: string;
    userId: string;
}

export interface ITransacaoInputDTO {
    data: IData;
    descricao: string;
    valor: IDinheiroProps;
    categoriaId: string;
    contaId?: string;
    userId?: string; // will be set by controller from authenticated user
}

export interface ITransacaoReembolsoDTO {
    data: IData;
    descricao: string;
    valor: IDinheiroProps;
    categoriaId: string;
    reembolso: string;
    contaId?: string;
    userId?: string;
}

export interface ITransacaoUpdateDTO {
    data?: IData;
    descricao?: string;
    valor?: IDinheiroProps;
    tipo?: string;
    categoriaId?: string;
    status?: string;
    reembolso?: string;
    contaId?: string;
}