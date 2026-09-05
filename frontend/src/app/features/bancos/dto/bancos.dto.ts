/**
 * Data Transfer Object for banco
 */
export interface BancosDTO {
  id?: string;
  user?: { id: string; nome?: string };
  nome: string;
  icon: string;
  contasCartoesSelecionados?: string[];
}

/**
 * Data Transfer Object for Banco (Input)
 * Used when creating
 */
export interface BancosInputDTO {
  nome: string;
  icon: string;
}

/**
 * Data Transfer Object for Banco Update (Input)
 */
export interface BancosUpdateDTO {
  nome?: string;
  icon?: string;
  contasCartoesSelecionados?: string[];
}
