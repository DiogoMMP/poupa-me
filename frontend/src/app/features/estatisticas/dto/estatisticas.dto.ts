/**
 * Frontend DTOs that mirror backend `IEstatisticasDTO` shape
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

export interface ICategoriaDTO {
  id?: string;
  nome: string;
  icon: string;
}

export interface ICategoriaEstatisticaDTO {
  categoria: ICategoriaDTO;
  total: IDinheiroProps;
}

export interface IHistoricoDiarioDTO {
  data: IDataProps;
  total: IDinheiroProps;
}

export interface EstatisticasDto {
  cashflowMensal: {
    totalIn: number;
    totalOut: number;
    netBalance: number;
  };
  categorias: ICategoriaEstatisticaDTO[];
  historicoDiario: IHistoricoDiarioDTO[];
}

