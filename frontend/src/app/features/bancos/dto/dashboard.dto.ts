/**
 * Data Transfer Object for Dashboard Data
 */
export interface DashboardDTO {
  saldoGlobal: number;
  detalhePorBanco: DetalheBancoDTO[];
}

/**
 * Data Transfer Object for Banco Detail in Dashboard
 */
export interface DetalheBancoDTO {
  id: string;
  nome: string;
  icon: string;
  saldoContas: number;
  saldoCartoes: number;
  totalBanco: number;
}

