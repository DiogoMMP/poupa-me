export interface EntityReferenceModel {
  id: string;
  nome?: string;
  descricao?: string;
  icon?: string;
}

/**
 * UI model used by transaction lists and components
 */
export interface TransacaoModel {
  id: string;
  dia: number;
  mes: number;
  ano: number;
  descricao: string;
  valor: number;
  moeda: string;
  tipo: string;
  categoria: { id?: string; nome: string; icon: string };
  status: string;
  conta?: EntityReferenceModel;
  cartaoCredito?: EntityReferenceModel;
  contaDestino?: EntityReferenceModel;
  contaPoupanca?: EntityReferenceModel;
  user?: EntityReferenceModel;
  userId?: string;
}
