/**
 * Mirror of DataModel.DTO.UserDto returned by GET /api/User.
 */
export interface UserDTO {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isActive: boolean;
}

/**
 * Request payload for POST /api/User/create-user.
 */
export interface CreateUserRequest {
  userId?: string;
  name: string;
  email: string;
}

/**
 * Response from POST /api/User/create-user (UserResponseDto on backend).
 */
export interface CreatedUserResponse {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  locale?: string | null;
}
