export interface IUserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface IUserRegistrationDTO {
  email: string;
  name: string;
  password: string;
  role?: string; // Optional role, default to 'user' if not provided
}

export interface IUserLoginDTO {
  email: string;
  password: string;
}

export interface IUserUpdateDTO {
  email: string;
  name?: string;
  password?: string;
}
