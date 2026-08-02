import { IEntityReferenceDTO } from "./shared/IEntityReferenceDTO.js";

/**
 * Data Transfer Object for Banco entity (detail view — includes contasCartoesSelecionados).
 * Used for GET /banco/:id
 */
export interface IBancoDTO {
    id: string;
    user?: IEntityReferenceDTO;
    nome: string;
    icon: string;
    contasCartoesSelecionados?: IEntityReferenceDTO[];
}

/**
 * Lightweight DTO for Banco list responses (no contasCartoesSelecionados).
 * Used for GET /banco
 */
export interface IBancoSummaryDTO {
    id: string;
    user?: IEntityReferenceDTO;
    nome: string;
    icon: string;
}

/**
 * DTO for creating a new Banco
 */
export interface ICreateBancoDTO {
    nome: string;
    icon: string;
}

/**
 * DTO for updating an existing Banco
 */
export interface IUpdateBancoDTO {
    nome?: string;
    icon?: string;
    contasCartoesSelecionados?: string[];
}

