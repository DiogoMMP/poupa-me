/**
 * Data Transfer Object for Perfil
 */
export interface PerfilDTO {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Payload for PATCH /api/auth/:email */
export interface AtualizarPerfilDTO {
  name?: string;
  password?: string;
}
