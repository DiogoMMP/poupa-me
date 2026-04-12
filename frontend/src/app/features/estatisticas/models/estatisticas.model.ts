/**
 * Model for Dashboard Data
 */
/**
 * Frontend models for statistics feature (maps from backend DTOs)
 */

export interface IDataProps {
  dia: number;
  mes: number;
  ano: number;
}

export interface IDinheiroProps {
  valor: number;
  moeda: string;
}

export interface ICategoriaModel {
  id?: string;
  nome: string;
  icon: string;
}

export interface ICategoriaEstatisticaModel {
  categoria: ICategoriaModel;
  total: IDinheiroProps;
}

export interface IHistoricoDiarioModel {
  data: IDataProps;
  total: IDinheiroProps;
}

export interface EstatisticasModel {
  cashflowMensal: {
    totalIn: number;
    totalOut: number;
    netBalance: number;
  };
  categorias: ICategoriaEstatisticaModel[];
  historicoDiario: IHistoricoDiarioModel[];
}

