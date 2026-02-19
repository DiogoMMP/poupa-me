export interface CartoesCreditoModel {
  id: string;
  userId?: string;
  nome: string;
  icon: string;
  limiteCredito: {
    valor: number;
    moeda: string;
  };
  saldoUtilizado: {
    valor: number;
    moeda: string;
  };
  periodo: {
    dataInicio: string; // ISO date string
    dataFim: string; // ISO date string
  };
  contaPagamentoId: string;
  bancoId?: string;
}

