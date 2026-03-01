/**
 * Auth model - login credentials and user data
 */

/** UI model for the authenticated user */
export interface AuthUserModel {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Login credentials */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Registration data */
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

/** Response after successful auth */
export interface AuthResponse {
  user: AuthUserModel;
}
