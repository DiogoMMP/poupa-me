import {ICategoriaDTO} from "./ICategoriaDTO.js";
import {IDataProps, IDinheiroProps} from "./ITransacaoDTO.js";

/**
 * Statistics for a single category returned by the statistics endpoint.
 */
export interface ICategoriaEstatistica {
    categoria: ICategoriaDTO;
    total: IDinheiroProps;
}

/**
 * Daily history entry used to build charts.
 */
export interface IHistoricoDiario {
    data: IDataProps;
    total: IDinheiroProps;
}

/**
 * Top-level statistics payload returned by the statistics API.
 */
export interface IEstatisticasDTO {
    cashflowMensal: {
        totalIn: number;
        totalOut: number;
        netBalance: number;
    };
    categorias: ICategoriaEstatistica[];
    historicoDiario: IHistoricoDiario[];
}