import {ICategoriaDTO} from "./ICategoriaDTO.js";
import {IDataDTO} from "./shared/IDataDTO.js";
import {IDinheiroDTO} from "./shared/IDinheiroDTO.js";

/**
 * Statistics for a single category returned by the statistics endpoint.
 */
export interface ICategoriaEstatistica {
    categoria: ICategoriaDTO;
    total: IDinheiroDTO;
}

/**
 * Daily history entry used to build charts.
 */
export interface IHistoricoDiario {
    data: IDataDTO;
    total: IDinheiroDTO;
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