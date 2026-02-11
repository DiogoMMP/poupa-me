/**
 * Utilities to generate and parse domain IDs with a configurable prefix and an 11-digit sequence.
 * e.g. prefix = 'USR' => IDs like 'USR00000000001'
 * - Prefix is always required (no default)
 * - Sequence is 11 digits, zero-padded (00000000001..99999999999)
 * - For transactions, supports year inclusion: prefix = 'TRN-2026' => IDs like 'TRN-2026-00000000001'
 */

const SEQUENCE_DIGITS = 11;

/**
 * Escape a string so it can safely be used inside a RegExp.
 */
function escapeForRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns a RegExp that matches IDs with the given prefix (captures the numeric sequence).
 * @param prefix - required prefix (e.g. 'USR', 'CNT', 'TRN-2026')
 */
export function createIdPattern(prefix: string): RegExp {
  const escaped = escapeForRegExp(prefix);
  return new RegExp(`^${escaped}(\\d{${SEQUENCE_DIGITS}})$`);
}

/**
 * Returns a regex string for database queries to find IDs with the given prefix.
 * @param prefix - required prefix
 */
export function createIdRegexString(prefix: string): string {
  const escaped = escapeForRegExp(prefix);
  return `^${escaped}\\d{${SEQUENCE_DIGITS}}$`;
}

/**
 * Returns the first ID for the given prefix.
 * @param prefix - required prefix (e.g. 'USR' => 'USR00000000001')
 */
export function generateFirstId(prefix: string): string {
  return `${prefix}${'0'.repeat(SEQUENCE_DIGITS - 1)}1`;
}

/**
 * Generates next ID given the current max sequence number.
 * @param maxSequence - current maximum numeric sequence (0 if none exist yet)
 * @param prefix - required prefix
 * @returns next ID (e.g. if maxSequence=1 and prefix='USR' => 'USR00000000002')
 */
export function generateNextId(maxSequence: number, prefix: string): string {
  const next = (maxSequence ?? 0) + 1;
  const maxAllowed = Math.pow(10, SEQUENCE_DIGITS) - 1;
  if (next > maxAllowed) {
    throw new Error(`ID sequence overflow: exceeds ${maxAllowed}`);
  }
  const padded = String(next).padStart(SEQUENCE_DIGITS, '0');
  return `${prefix}${padded}`;
}

/**
 * Extracts the numeric sequence from an ID. Returns null if the id does not match the prefix pattern.
 * @param id - the ID string to parse
 * @param prefix - required prefix to match against
 */
export function extractSequenceNumber(id: string, prefix: string): number | null {
  const pattern = createIdPattern(prefix);
  const match = id.match(pattern);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Generates a transaction-specific prefix including the year.
 * @param year - transaction year (e.g. 2026)
 * @returns prefix like 'TRN-2026'
 */
export function generateTransactionPrefix(year: number): string {
  return `TRN-${year}`;
}

/**
 * Generates the first transaction ID for a given year.
 * @param year - transaction year
 * @returns ID like 'TRN-2026-00000000001'
 */
export function generateFirstTransactionId(year: number): string {
  const prefix = `${generateTransactionPrefix(year)}-`;
  return generateFirstId(prefix);
}

/**
 * Generates next transaction ID for a given year and max sequence.
 * @param maxSequence - current max sequence for that year (0 if none)
 * @param year - transaction year
 * @returns next ID (e.g. 'TRN-2026-00000000002')
 */
export function generateNextTransactionId(maxSequence: number, year: number): string {
  const prefix = `${generateTransactionPrefix(year)}-`;
  return generateNextId(maxSequence, prefix);
}

/**
 * Extracts the numeric sequence from a transaction ID.
 * @param id - transaction ID string
 * @param year - transaction year to validate prefix
 * @returns numeric sequence or null if invalid
 */
export function extractTransactionSequence(id: string, year: number): number | null {
  const prefix = `${generateTransactionPrefix(year)}-`;
  return extractSequenceNumber(id, prefix);
}

// ===== Domain-specific helpers =====

/**
 * User domain ID helpers - prefix 'USR'
 */
export const UserIdHelper = {
  prefix: 'USR',
  generateFirst: () => generateFirstId('USR'),
  generateNext: (maxSeq: number) => generateNextId(maxSeq, 'USR'),
  extractSequence: (id: string) => extractSequenceNumber(id, 'USR')
};

/**
 * Conta domain ID helpers - prefix 'CNT'
 */
export const ContaIdHelper = {
  prefix: 'CNT',
  generateFirst: () => generateFirstId('CNT'),
  generateNext: (maxSeq: number) => generateNextId(maxSeq, 'CNT'),
  extractSequence: (id: string) => extractSequenceNumber(id, 'CNT')
};

/**
 * Categoria domain ID helpers - prefix 'CAT'
 */
export const CategoriaIdHelper = {
  prefix: 'CAT',
  generateFirst: () => generateFirstId('CAT'),
  generateNext: (maxSeq: number) => generateNextId(maxSeq, 'CAT'),
  extractSequence: (id: string) => extractSequenceNumber(id, 'CAT')
};

/**
 * CartaoCredito domain ID helpers - prefix 'CCR'
 */
export const CartaoCreditoIdHelper = {
  prefix: 'CCR',
  generateFirst: () => generateFirstId('CCR'),
  generateNext: (maxSeq: number) => generateNextId(maxSeq, 'CCR'),
  extractSequence: (id: string) => extractSequenceNumber(id, 'CCR')
};

/**
 * Transacao domain ID helpers - prefix 'TRN-{year}'
 * IDs include year: e.g. 'TRN-2026-00000000001'
 */
export const TransacaoIdHelper = {
  generatePrefix: (year: number) => generateTransactionPrefix(year),
  generateFirst: (year: number) => generateFirstTransactionId(year),
  generateNext: (maxSeq: number, year: number) => generateNextTransactionId(maxSeq, year),
  extractSequence: (id: string, year: number) => extractTransactionSequence(id, year)
};
