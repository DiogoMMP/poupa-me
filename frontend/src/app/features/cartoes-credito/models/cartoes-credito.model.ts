import { EntityReference } from '../../../shared/models/entity-reference.model';

export interface CartoesCreditoModel {
  id: string;
  user?: EntityReference;
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
  banco?: EntityReference;
}

