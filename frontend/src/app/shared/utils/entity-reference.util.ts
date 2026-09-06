import { EntityReference } from '../models/entity-reference.model';

/**
 * Format an entity reference for display as "Nome (id)", falling back to just the id when
 * the name hasn't been resolved, or "-" when there is no reference at all.
 */
export function formatEntityReference(ref?: EntityReference): string {
  if (!ref) return '-';
  return ref.nome ? `${ref.nome} (${ref.id})` : ref.id;
}
