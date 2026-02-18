import { ContasDto } from '../dto/contas.dto';
import { ContasModel } from '../models/contas.model';

/**
 * Mapper for Contas - converts between DTO and Model
 */
export class ContasMapper {
  /**
   * Convert DTO to Model
   */
  static toModel(dto: ContasDto): ContasModel {
    return {
      id: dto.id || '',
      userId: dto.userId || undefined,
      nome: dto.nome,
      icon: dto.icon,
      saldo: {
        valor: dto.saldo.valor,
        moeda: dto.saldo.moeda
      },
      bancoId: dto.bancoId
    };
  }

  /**
   * Convert Model to DTO
   */
  static toDto(model: ContasModel): ContasDto {
    return {
      id: model.id,
      nome: model.nome,
      icon: model.icon,
      saldo: {
        valor: model.saldo.valor,
        moeda: model.saldo.moeda
      },
      bancoId: model.bancoId
    };
  }

  /**
   * Convert array of DTOs to array of Models
   */
  static toModelArray(dtos: ContasDto[]): ContasModel[] {
    return dtos.map(dto => ContasMapper.toModel(dto));
  }
}
