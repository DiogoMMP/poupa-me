/**
 * Returned as the error of a delete of a Banco or Conta that still has active children and was not asked to cascade.
 * The controller maps it to HTTP 409 with the counts, so the frontend can warn before the user confirms a cascade.
 */
export interface IFilhosAtivosDTO {
    code: 'ACTIVE_CHILDREN';
    contasAtivas: number;
    cartoesAtivos: number;
    regrasAtivas: number;
}

export const isFilhosAtivos = (error: unknown): error is IFilhosAtivosDTO =>
    typeof error === 'object' && error !== null && (error as IFilhosAtivosDTO).code === 'ACTIVE_CHILDREN';
