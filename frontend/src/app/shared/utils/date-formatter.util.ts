/**
 * Shared date and currency formatting utilities.
 */

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Format a day + month number into a short date label.
 * Example: formatData(15, 1) → "15 Jan"
 */
export function formatData(dia: number, mes: number): string {
  return `${dia} ${MESES_ABREV[mes - 1] ?? ''}`;
}

/**
 * Format a numeric valor to a Portuguese currency string.
 * Example: formatValor(1234.56) → "1.234,56 €"
 */
export function formatValor(valor: number): string {
  return valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}
