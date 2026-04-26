// ── Despesa Recorrente DTOs ────────────────────────────────────

export interface DinheiroProps {
  valor: number;
  moeda: string;
}

export interface DataProps {
  dia: number;
  mes: number;
  ano: number;
}

export type TipoDespesaRecorrente = 'Despesa Mensal' | 'Poupança' | 'Despesa Semanal' | 'Despesa Anual';

export interface DespesaRecorrenteDTO {
  id: string;
  userId: string;
  nome: string;
  icon: string;
  valor?: DinheiroProps;
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
}

export interface CreateDespesaRecorrenteDTO {
  nome: string;
  icon: string;
  valor?: DinheiroProps;
  diaDoMes?: number;
  categoriaId: string;
  contaOrigemId: string;
  contaDestinoId?: string;
  contaPoupancaId?: string;
  tipo?: TipoDespesaRecorrente;
  ativo?: boolean;
  imediata?: boolean;
  diaDaSemana?: number;
  mes?: number;
}

export interface UpdateDespesaRecorrenteDTO {
  nome?: string;
  icon?: string;
  valor?: DinheiroProps;
  diaDoMes?: number;
  categoriaId?: string;
  contaOrigemId?: string;
  contaDestinoId?: string;
  contaPoupancaId?: string;
  tipo?: TipoDespesaRecorrente;
  ativo?: boolean;
  imediata?: boolean;
  diaDaSemana?: number;
  mes?: number;
}

/** Payload for POST /:id/gerar-transacao */
export interface GerarTransacaoSemValorDTO {
  valor: DinheiroProps;
  data: DataProps;
}

