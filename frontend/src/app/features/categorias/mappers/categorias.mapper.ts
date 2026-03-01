 import { CategoriasDTO } from '../dto/categorias.dto';
import { CategoriasModel } from '../models/categorias.model';

/**
 * Mapper for Categorias - converts between DTO and Model
 */
export class CategoriasMapper {
  /**
   * Convert DTO to Model
   */
  static toModel(dto: CategoriasDTO): CategoriasModel {
    return {
      id: dto.id || '',
      nome: dto.nome,
      icon: dto.icon,
    };
  }

  /**
   * Convert Model to DTO
   */
  static toDto(model: CategoriasModel): CategoriasDTO {
    return {
      id: model.id,
      nome: model.nome,
      icon: model.icon,
    };
  }

  /**
   * Convert array of DTOs to array of Models
   */
  static toModelArray(dtos: CategoriasDTO[]): CategoriasModel[] {
    return dtos.map(dto => CategoriasMapper.toModel(dto));
  }
}
