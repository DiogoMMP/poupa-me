import {TransacoesDTO} from '../../transacoes/dto/transacoes.dto';

/**
 * Data Transfer Object for Extrato do Cartão de Crédito
 */
export interface ExtratoCartaoDTO {
  transacoes: TransacoesDTO[];
  saldoAtual: {
    valor: number;
    moeda: string;
  };
}

/**
 * Data Transfer Object for Cartão de Crédito
 */
export interface CartoesCreditoDTO {
    id?: string;
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
        inicio: {
            dia: number;
            mes: number;
            ano: number;
        };
        fecho: {
            dia: number;
            mes: number;
            ano: number;
        };
    };
    contaPagamentoId: string;
    bancoId?: string;
}

/**
 * Data Transfer Object for Cartão de Crédito (Input)
 * Used when creating
 */
export interface CartoesCreditoInputDTO {
    nome: string;
    icon: string;
    limiteCredito: {
        valor: number;
        moeda: string;
    };
    saldoUtilizado?: {
        valor: number;
        moeda: string;
    };
    periodo: {
        inicio: {
            dia: number;
            mes: number;
            ano: number;
        };
        fecho: {
            dia: number;
            mes: number;
            ano: number;
        };
    }
    contaPagamentoId: string;
    bancoId?: string;
}

/**
 * Data Transfer Object for Cartão de Crédito Update (Input)
 */
export interface CartoesCreditoUpdateDTO {
    nome?: string;
    icon?: string;
    limiteCredito?: {
        valor: number;
        moeda: string;
    };
    periodo?: {
        inicio: {
            dia: number;
            mes: number;
            ano: number;
        };
        fecho: {
            dia: number;
            mes: number;
            ano: number;
        };
    };
    contaPagamentoId?: string;
    bancoId?: string;
}
