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

export interface DespesaRecorrenteDTO {
  id: string;
  userId: string;
  nome: string;
  icon: string;
  valor?: DinheiroProps;
  diaDoMes?: number;
  categoriaId: string;
  contaOrigemId: string;
  contaDestinoId: string;
  contaPoupancaId?: string;
  tipo: 'Despesa Mensal' | 'Poupança';
  ultimoProcessamento: string | null;
  ativo: boolean;
}

export interface CreateDespesaRecorrenteDTO {
  nome: string;
  icon: string;
  valor?: DinheiroProps;
  diaDoMes?: number;
  categoriaId: string;
  contaOrigemId: string;
  contaDestinoId: string;
  contaPoupancaId?: string;
  tipo?: 'Despesa Mensal' | 'Poupança';
  ativo?: boolean;
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
  tipo?: 'Despesa Mensal' | 'Poupança';
  ativo?: boolean;
}

/** Payload for POST /:id/gerar-transacao */
export interface GerarTransacaoSemValorDTO {
  valor: DinheiroProps;
  data: DataProps;
}

