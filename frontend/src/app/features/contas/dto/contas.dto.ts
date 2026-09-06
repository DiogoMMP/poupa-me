/**
 * Data Transfer Object for Contas
 */
export interface ContasDto {
    id?: string;
    user?: { id: string; nome?: string };
    nome: string;
    icon: string;
    saldo: {
        valor: number;
        moeda: string;
    };
    banco?: { id: string; nome?: string; icon?: string };
}

/**
 * Data Transfer Object for Contas (Input)
 * Used when creating
 */
export interface ContasInputDTO {
    nome: string;
    icon: string;
    saldo: {
        valor: number;
        moeda: string;
    };
    bancoId: string;
}

/**
 * Data Transfer Object for Contas Update (Input)
 */
export interface ContasUpdateDTO {
    nome?: string;
    icon?: string;
}
