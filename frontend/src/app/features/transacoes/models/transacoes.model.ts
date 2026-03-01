import { ContasModel } from '../../contas/models/contas.model';
import { CartoesCreditoModel } from '../../cartoes-credito/models/cartoes-credito.model';

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
  conta?: ContasModel;
  cartaoCredito?: CartoesCreditoModel;
  userId: string;
}
