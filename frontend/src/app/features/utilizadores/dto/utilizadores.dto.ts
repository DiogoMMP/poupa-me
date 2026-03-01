/**
 * Data Transfer Object for Utilizador
 */
export interface UtilizadorDTO {
  userId: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  isActive?: boolean;
}

/** Payload for PATCH /api/auth/:email — only role toggle is used */
export interface EditarUtilizadorDTO {
  role?: string;
}
