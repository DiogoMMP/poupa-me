import { AuthResponseDTO } from '../dto/auth.dto';
import { AuthResponse } from '../models/auth.model';

export class AuthMapper {
  static toUserModel(dto: AuthResponseDTO): AuthResponse {
    return {
      token: dto.token,
      user: {
        id: dto.user.id,
        name: dto.user.name,
        email: dto.user.email,
        role: dto.user.role,
      }
    };
  }
}

