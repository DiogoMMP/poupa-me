/**
 * Data Transfer Object for Banco entity.
 * Used for API communication.
 */
export interface IBancoDTO {
    id: string;
    userId: string;
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
}

