import { EntityReference } from '../../../shared/models/entity-reference.model';

export interface ContasModel {
  id: string;
  user?: EntityReference;
  nome: string;
  icon: string;
  saldo: {
    valor: number;
    moeda: string;
  };
  banco?: EntityReference;
}
