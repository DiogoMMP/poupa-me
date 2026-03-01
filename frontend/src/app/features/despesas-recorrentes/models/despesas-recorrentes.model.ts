/**
 * UI model for a Despesa Recorrente (recurring expense rule)
 */
export interface DespesaRecorrenteModel {
  id: string;
  userId: string;
  nome: string;
  icon: string;
  valor?: number;
  moeda?: string;
  diaDoMes?: number;
  categoriaId: string;
  contaOrigemId: string;
  contaDestinoId: string;
  contaPoupancaId?: string;
  tipo: 'Despesa Mensal' | 'Poupança';
  ultimoProcessamento: string | null;
  ativo: boolean;
  /** True when valor and diaDoMes are set */
  temValor: boolean;
}

