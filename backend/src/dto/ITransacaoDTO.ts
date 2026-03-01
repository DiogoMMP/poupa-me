import type {ICategoriaDTO} from "./ICategoriaDTO.js";
import type {IContaDTO} from "./IContaDTO.js";
import type {ICartaoCreditoDTO} from "./ICartaoCreditoDTO.js";

export interface IDataProps {
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
    data: IDataProps;
    descricao: string;
    valor: IDinheiroProps;
    tipo: string;
    categoria: ICategoriaDTO;
    status: string;
    conta?: IContaDTO;
    cartaoCredito?: ICartaoCreditoDTO;
    contaDestino?: IContaDTO;
    contaPoupanca?: IContaDTO;
    userId: string;
}

export interface ITransacaoInputDTO {
    data: IDataProps;
    descricao: string;
    valor: IDinheiroProps;
    categoriaId: string;
    contaId?: string;
    cartaoCreditoId?: string;
    contaDestinoId?: string; // Only for Despesa Mensal
    contaPoupancaId?: string; // Only for Poupança - the savings account
    userId?: string;
}

export interface ITransacaoReembolsoDTO {
    data: IDataProps;
    descricao: string;
    valor: IDinheiroProps;
    categoriaId: string;
    contaId?: string;
    cartaoCreditoId?: string;
    userId?: string;
}

export interface ITransacaoUpdateDTO {
    data?: IDataProps;
    descricao?: string;
    valor?: IDinheiroProps;
    tipo?: string;
    categoriaId?: string;
    status?: string;
    contaId?: string;
    cartaoCreditoId?: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
}
