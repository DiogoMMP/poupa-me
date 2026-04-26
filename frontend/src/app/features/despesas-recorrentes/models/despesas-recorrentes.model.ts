
export type TipoDespesaRecorrente = 'Despesa Mensal' | 'Poupança' | 'Despesa Semanal' | 'Despesa Anual';

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
  contaDestinoId?: string;
  contaPoupancaId?: string;
  tipo: TipoDespesaRecorrente;
  ultimoProcessamento: string | null;
  ativo: boolean;
  imediata: boolean;
  diaDaSemana?: number;
  mes?: number;
  /** True when a recurring expense has a value defined */
  temValor: boolean;
}

