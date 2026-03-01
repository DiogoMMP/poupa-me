import { PerfilDTO } from '../dto/perfil.dto';
import { PerfilModel } from '../models/perfil.model';

/**
 * Mapper for Perfis - converts between API DTO and UI Model
 */
export class PerfilMapper {
  static toModel(dto: PerfilDTO): PerfilModel {
    return {
      id:    dto.id,
      nome:  dto.name,
      email: dto.email,
      role:  dto.role,
    };
  }
}
