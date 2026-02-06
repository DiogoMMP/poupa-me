/**
 * Utilities to generate and parse IDs with a configurable prefix and a 3-digit sequence
 * e.g. prefix = 'T-INC' => IDs like 'T-INC001'
 * - Prefix is provided as parameter (default 'T-INC')
 * - Sequence is 3 digits, zero-padded (001..999)
 */

const DEFAULT_PREFIX = 'T-INC';

/**
 * Escape a string so it can safely be used inside a RegExp
 */
function escapeForRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns a RegExp that matches IDs with the given prefix (captures the numeric sequence).
 * @param prefix - the literal prefix that appears before the 3-digit sequence (e.g. 'T-INC')
 */
export function createIdPattern(prefix: string = DEFAULT_PREFIX): RegExp {
  const escaped = escapeForRegExp(prefix);
  return new RegExp(`^${escaped}(\\d{3})$`);
}

/**
 * Returns a MongoDB-compatible regex string to find IDs with the given prefix.
 */
export function createIdRegexString(prefix: string = DEFAULT_PREFIX): string {
  const escaped = escapeForRegExp(prefix);
  // In a string form we want the unescaped backslash for \d
  return `^${escaped}\\d{3}$`;
}

/**
 * Returns the first ID for the given prefix: e.g. 'T-INC001'
 */
export function generateFirstId(prefix: string = DEFAULT_PREFIX): string {
  return `${prefix}001`;
}

/**
 * Generates next ID given the current max sequence number.
 * @param maxSequence - current maximum numeric sequence (0 if none)
 * @param prefix - optional prefix (default 'T-INC')
 * @returns next ID (e.g. if maxSequence=1 => T-INC002)
 */
export function generateNextId(maxSequence: number, prefix: string = DEFAULT_PREFIX): string {
  const next = (maxSequence ?? 0) + 1;
  if (next > 999) {
    throw new Error('ID sequence overflow: exceeds 999');
  }
  const padded = String(next).padStart(3, '0');
  return `${prefix}${padded}`;
}

/**
 * Extracts the numeric sequence from an ID. If prefix is provided, it will only match that prefix.
 * Returns null if the id does not match.
 */
export function extractSequenceNumber(id: string, prefix: string = DEFAULT_PREFIX): number | null {
  const pattern = createIdPattern(prefix);
  const match = id.match(pattern);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
