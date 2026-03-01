/**
 * Model for Dashboard Data
 */
export interface DashboardModel {
  saldoGlobal: number;
  detalhePorBanco: DetalheBancoModel[];
}

/**
 * Model for Banco Detail in Dashboard
 */
export interface DetalheBancoModel {
  id: string;
  nome: string;
  icon: string;
  saldoContas: number;
  saldoCartoes: number;
  totalBanco: number;
}

