import { EstatisticasDto } from '../dto/estatisticas.dto';
import { EstatisticasModel } from '../models/estatisticas.model';

/**
 * Mapper for Statistics - converts backend DTO to frontend Model
 */
export class EstatisticasMapper {
  static toModel(dto: EstatisticasDto): EstatisticasModel {
    return {
      cashflowMensal: {
        totalIn: dto.cashflowMensal.totalIn,
        totalOut: dto.cashflowMensal.totalOut,
        netBalance: dto.cashflowMensal.netBalance
      },
      categorias: dto.categorias.map(c => ({
        categoria: {
          id: c.categoria.id,
          nome: c.categoria.nome,
          icon: c.categoria.icon
        },
        total: {
          valor: c.total.valor,
          moeda: c.total.moeda
        }
      })),
      historicoDiario: dto.historicoDiario.map(h => ({
        data: {
          dia: h.data.dia,
          mes: h.data.mes,
          ano: h.data.ano
        },
        total: {
          valor: h.total.valor,
          moeda: h.total.moeda
        }
      }))
    };
  }
}

