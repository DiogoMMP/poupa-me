/**
 * Data Transfer Object for categoria
 */
export interface CategoriasDTO {
  id?: string;
  nome: string;
  icon: string;
}

/**
 * Data Transfer Object for Categoria (Input)
 * Used when creating
 */
export interface CategoriasInputDTO {
  nome: string;
  icon: string;
}
