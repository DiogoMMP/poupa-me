import { CartoesCreditoDTO } from '../dto/cartoes-credito.dto';
import { CartoesCreditoModel } from '../models/cartoes-credito.model';

/**
 * Mapper for Cartões de Crédito - converts between DTO and Model
 */
export class CartoesCreditoMapper {
  /**
   * Convert DTO to Model
   */
  static toModel(dto: CartoesCreditoDTO): CartoesCreditoModel {
    return {
      id: dto.id || '',
      userId: dto.userId || undefined,
      nome: dto.nome,
      icon: dto.icon,
      limiteCredito: {
        valor: dto.limiteCredito.valor,
        moeda: dto.limiteCredito.moeda
      },
      saldoUtilizado: {
        valor: dto.saldoUtilizado?.valor || 0,
        moeda: dto.saldoUtilizado?.moeda || 'EUR'
      },
      periodo: {
        dataInicio: this.dataPropsToISOString(dto.periodo.inicio),
        dataFim: this.dataPropsToISOString(dto.periodo.fecho)
      },
      contaPagamentoId: dto.contaPagamentoId,
      bancoId: dto.bancoId
    };
  }

  /**
   * Convert Model to DTO
   */
  static toDto(model: CartoesCreditoModel): CartoesCreditoDTO {
    return {
      id: model.id,
      nome: model.nome,
      icon: model.icon,
      limiteCredito: {
        valor: model.limiteCredito.valor,
        moeda: model.limiteCredito.moeda
      },
      saldoUtilizado: {
        valor: model.saldoUtilizado.valor,
        moeda: model.saldoUtilizado.moeda
      },
      periodo: {
        inicio: this.isoStringToDataProps(model.periodo.dataInicio),
        fecho: this.isoStringToDataProps(model.periodo.dataFim)
      },
      contaPagamentoId: model.contaPagamentoId,
      bancoId: model.bancoId
    };
  }

  /**
   * Convert array of DTOs to array of Models
   */
  static toModelArray(dtos: CartoesCreditoDTO[]): CartoesCreditoModel[] {
    return dtos.map(dto => CartoesCreditoMapper.toModel(dto));
  }

  /**
   * Convert DataProps (dia/mes/ano) to ISO date string
   */
  private static dataPropsToISOString(data: { dia: number; mes: number; ano: number }): string {
    if (!data || !data.dia || !data.mes || !data.ano) {
      return '';
    }
    // Create date with year, month (0-indexed), day
    const date = new Date(data.ano, data.mes - 1, data.dia);
    return date.toISOString();
  }

  /**
   * Convert ISO date string to DataProps (dia/mes/ano)
   */
  private static isoStringToDataProps(isoString: string): { dia: number; mes: number; ano: number } {
    if (!isoString) {
      const now = new Date();
      return { dia: now.getDate(), mes: now.getMonth() + 1, ano: now.getFullYear() };
    }
    const date = new Date(isoString);
    return {
      dia: date.getDate(),
      mes: date.getMonth() + 1,
      ano: date.getFullYear()
    };
  }
}
