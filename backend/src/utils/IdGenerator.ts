/**
 * Creates an ID pattern regex for matching IDs of a specific prefix and year.
 * @param prefix - The ID prefix (e.g., 'OP')
 * @param year - The year to match
 * @returns RegExp that matches the ID pattern
 */
export function createIdPattern(prefix: string, year: number): RegExp {
  return new RegExp(`^${prefix}-${year}-(\\d{5})$`);
}

/**
 * Creates a MongoDB regex string for finding IDs of a specific prefix and year.
 * @param prefix - The ID prefix (e.g., 'OP')
 * @param year - The year to match
 * @returns String regex pattern for MongoDB queries
 */
export function createIdRegexString(prefix: string, year: number): string {
  return `^${prefix}-${year}-\\d{5}$`;
}

/**
 * Generates the first ID for a given prefix and year.
 * @param prefix - The ID prefix
 * @param year - The year (defaults to current year)
 * @returns The first sequential ID (e.g., 'OP-2025-00001')
 */
export function generateFirstId(prefix: string, year?: number): string {
  const idYear = year ?? new Date().getFullYear();
  return `${prefix}-${idYear}-00001`;
}

/**
 * Generates the next sequential ID based on the maximum existing sequence number.
 * @param prefix - The ID prefix
 * @param maxSequence - The current maximum sequence number (0 if none exist)
 * @param year - The year (defaults to current year)
 * @returns The next sequential ID
 */
export function generateNextId(prefix: string, maxSequence: number, year?: number): string {
  const idYear = year ?? new Date().getFullYear();
  const nextNum = maxSequence + 1;
  const paddedNum = nextNum.toString().padStart(5, '0');
  return `${prefix}-${idYear}-${paddedNum}`;
}

/**
 * Extracts the sequence number from an ID string.
 * @param id - The full ID string (e.g., 'OP-2025-00456')
 * @param prefix - The expected prefix
 * @param year - The expected year
 * @returns The sequence number, or null if the ID doesn't match the pattern
 */
export function extractSequenceNumber(id: string, prefix: string, year: number): number | null {
  const pattern = createIdPattern(prefix, year);
  const match = id.match(pattern);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
