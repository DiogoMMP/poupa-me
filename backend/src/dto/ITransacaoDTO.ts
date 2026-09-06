import type {ICategoriaDTO} from "./ICategoriaDTO.js";
import type {IEntityReferenceDTO} from "./shared/IEntityReferenceDTO.js";
import type {IDinheiroDTO} from "./shared/IDinheiroDTO.js";
import type {IDataDTO} from "./shared/IDataDTO.js";

export interface ITransacaoDTO {
    id: string;
    data: IDataDTO;
    descricao: string;
    valor: IDinheiroDTO;
    tipo: string;
    categoria: ICategoriaDTO;
    status: string;
    conta?: IEntityReferenceDTO;
    cartaoCredito?: IEntityReferenceDTO;
    contaDestino?: IEntityReferenceDTO;
    contaPoupanca?: IEntityReferenceDTO;
    user?: IEntityReferenceDTO;
    /** True for the auto-generated "Pagamento X" record created by pagar cartão; it never carries its own balance impact. */
    isPagamentoCartao?: boolean;
}

export interface ITransacaoInputDTO {
    data: IDataDTO;
    descricao: string;
    valor: IDinheiroDTO;
    categoriaId: string;
    contaId?: string;
    cartaoCreditoId?: string;
    contaDestinoId?: string; // Only for Despesa Mensal
    contaPoupancaId?: string; // Only for Poupança - the savings account
    imediata?: boolean;
    userId?: string;
}

export interface ITransacaoReembolsoDTO {
    data: IDataDTO;
    descricao: string;
    valor: IDinheiroDTO;
    categoriaId: string;
    contaId?: string;
    cartaoCreditoId?: string;
    userId?: string;
}

export interface ITransacaoUpdateDTO {
    data?: IDataDTO;
    descricao?: string;
    valor?: IDinheiroDTO;
    tipo?: string;
    categoriaId?: string;
    status?: string;
    contaId?: string;
    cartaoCreditoId?: string;
    contaDestinoId?: string;
    contaPoupancaId?: string;
}
