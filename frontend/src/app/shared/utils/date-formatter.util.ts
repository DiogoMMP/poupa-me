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

/**
 * Today's date as an ISO string (yyyy-MM-dd), the same format `app-date-picker` uses.
 * Useful for binding `[maxDate]`/`[minDate]` to "today" from a consuming component.
 */
export function getTodayIso(): string {
  const now = new Date();
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
