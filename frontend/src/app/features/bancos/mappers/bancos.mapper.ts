import { BancosDTO } from '../dto/bancos.dto';
import { BancosModel } from '../models/bancos.model';

/**
 * Mapper for Bancos - converts between DTO and Model
 */
export class BancosMapper {
  /**
   * Convert DTO to Model
   */
  static toModel(dto: BancosDTO): BancosModel {
    return {
      id: dto.id || '',
      userId: dto.userId || undefined,
      nome: dto.nome,
      icon: dto.icon
    };
  }

  /**
   * Convert Model to DTO
   */
  static toDto(model: BancosModel): BancosDTO {
    return {
      id: model.id,
      nome: model.nome,
      icon: model.icon
    };
  }

  /**
   * Convert array of DTOs to array of Models
   */
  static toModelArray(dtos: BancosDTO[]): BancosModel[] {
    return dtos.map(dto => BancosMapper.toModel(dto));
  }
}
