import type {IDinheiroDTO} from "./shared/IDinheiroDTO.js";
import { IEntityReferenceDTO } from "./shared/IEntityReferenceDTO.js";

export interface IContaDTO {
    id: string;
    user?: IEntityReferenceDTO;
    nome: string;
    icon: string;
    saldo: IDinheiroDTO;
    banco?: IEntityReferenceDTO;
}

export interface IContaInputDTO {
    nome: string;
    icon: string;
    userId?: string; // will be set by controller from authenticated user
    saldo?: IDinheiroDTO; // optional initial balance; defaults to zero
    bancoId?: string;
}

export interface IContaUpdateDTO {
    nome?: string;
    icon?: string;
    bancoId?: string;
}