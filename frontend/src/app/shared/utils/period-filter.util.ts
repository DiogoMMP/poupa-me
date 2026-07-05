/**
 * Generic period-based filter utility.
 * Items must have { dia: number; mes: number; ano: number } fields.
 */
export type PeriodFilter = 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano' | '';

export function filterByPeriod<T extends { dia: number; mes: number; ano: number }>(
  items: T[],
  period: PeriodFilter
): T[] {
  if (!period) return items;
  const now = new Date();

  if (period === 'Este Mês') {
    return items.filter(t => t.mes === now.getMonth() + 1 && t.ano === now.getFullYear());
  }

  if (period === 'Últimos 3 Meses') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return items.filter(t => {
      const d = new Date(t.ano, t.mes - 1, t.dia);
      return d >= start && d <= now;
    });
  }

  if (period === 'Último Ano') {
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    return items.filter(t => {
      const d = new Date(t.ano, t.mes - 1, t.dia);
      return d >= start && d <= now;
    });
  }

  return items;
}
