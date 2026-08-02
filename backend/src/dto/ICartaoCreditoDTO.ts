import type {IDinheiroDTO} from "./shared/IDinheiroDTO.js";
import type {IDataDTO} from "./shared/IDataDTO.js";
import { IEntityReferenceDTO } from "./shared/IEntityReferenceDTO.js";

export interface IPeriodoProps {
    inicio: IDataDTO;
    fecho: IDataDTO;
}

export interface ICartaoCreditoDTO {
    id: string;
    user?: IEntityReferenceDTO;
    nome: string;
    icon: string;
    limiteCredito: IDinheiroDTO;
    saldoUtilizado: IDinheiroDTO;
    periodo: IPeriodoProps;
    contaPagamento: IEntityReferenceDTO;
    banco?: IEntityReferenceDTO;
}

export interface ICartaoCreditoInputDTO {
    nome: string;
    icon: string;
    userId?: string;
    limiteCredito: IDinheiroDTO;
    saldoUtilizado?: IDinheiroDTO; // optional initial balance; defaults to zero
    periodo: IPeriodoProps;
    contaPagamentoId: string;
    bancoId?: string;
}

export interface ICartaoCreditoUpdateDTO {
    nome?: string;
    icon?: string;
    limiteCredito?: IDinheiroDTO;
    periodo?: IPeriodoProps;
    contaPagamentoId?: string;
    bancoId?: string;
}