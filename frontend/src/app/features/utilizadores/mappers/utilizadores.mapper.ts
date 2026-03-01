import { UtilizadorDTO } from '../dto/utilizadores.dto';
import { UtilizadoresModel } from '../models/utilizadores.model';

/**
 * Mapper for Utilizadores - converts between API DTO and UI Model
 */
export class UtilizadoresMapper {
  static toModel(dto: UtilizadorDTO): UtilizadoresModel {
    return {
      id:       dto.userId,
      nome:     dto.name,
      email:    dto.email,
      role:     dto.role,
      isActive: dto.isActive ?? true,
    };
  }

  static toModelArray(dtos: UtilizadorDTO[]): UtilizadoresModel[] {
    return dtos.map(d => this.toModel(d));
  }
}
