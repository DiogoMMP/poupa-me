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
      user: dto.user,
      nome: dto.nome,
      icon: dto.icon,
      contasCartoesSelecionados: (dto.contasCartoesSelecionados || []).map(ref => ref.id)
    };
  }

  /**
   * Convert Model to DTO
   */
  static toDto(model: BancosModel): BancosDTO {
    return {
      id: model.id,
      user: model.user,
      nome: model.nome,
      icon: model.icon,
      contasCartoesSelecionados: model.contasCartoesSelecionados?.map(id => ({ id }))
    };
  }

  /**
   * Convert array of DTOs to array of Models
   */
  static toModelArray(dtos: BancosDTO[]): BancosModel[] {
    return dtos.map(dto => BancosMapper.toModel(dto));
  }
}
