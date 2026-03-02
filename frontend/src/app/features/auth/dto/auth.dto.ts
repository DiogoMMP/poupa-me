/** Payload sent to POST /auth/login */
export interface LoginDTO {
  email: string;
  password: string;
}

/** Payload sent to POST /auth/register */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

/** Response received from both login and register */
export interface AuthResponseDTO {
  token?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

