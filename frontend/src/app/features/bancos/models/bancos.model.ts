import { EntityReference } from '../../../shared/models/entity-reference.model';

export interface BancosModel {
  id: string;
  user?: EntityReference;
  nome: string;
  icon: string;
  contasCartoesSelecionados?: string[];
}
