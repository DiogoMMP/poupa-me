/**
 * Shared shape for an entity reference (id + resolved display fields) as returned by the
 * backend for owner/related-entity fields (e.g. `user`, `banco`, `conta`) since the DTOs moved
 * from loose ids to entity references. Used identically at the DTO and Model layer.
 */
export interface EntityReference {
  id: string;
  nome?: string;
  descricao?: string;
  icon?: string;
}
