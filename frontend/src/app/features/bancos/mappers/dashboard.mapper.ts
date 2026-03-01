import { DashboardDTO, DetalheBancoDTO } from '../dto/dashboard.dto';
import { DashboardModel, DetalheBancoModel } from '../models/dashboard.model';

/**
 * Mapper for Dashboard - converts between DTO and Model
 */
export class DashboardMapper {
  /**
   * Convert DetalheBancoDTO to DetalheBancoModel
   */
  static detalheBancoToModel(dto: DetalheBancoDTO): DetalheBancoModel {
    return {
      id: dto.id,
      nome: dto.nome,
      icon: dto.icon,
      saldoContas: dto.saldoContas,
      saldoCartoes: dto.saldoCartoes,
      totalBanco: dto.totalBanco
    };
  }

  /**
   * Convert DashboardDto to DashboardModel
   */
  static toModel(dto: DashboardDTO): DashboardModel {
    return {
      saldoGlobal: dto.saldoGlobal,
      detalhePorBanco: dto.detalhePorBanco.map(detalhe =>
        DashboardMapper.detalheBancoToModel(detalhe)
      )
    };
  }
}

