// Re-export shared types and functions so existing imports continue to work
export type { PeriodFilter } from '../../../../shared/utils/period-filter.util';
export { filterByPeriod } from '../../../../shared/utils/period-filter.util';

export interface ContaFilters {
  categoriaId: string;
  contaId: string;
  period: import('../../../../shared/utils/period-filter.util').PeriodFilter;
}

export interface CartaoFilters {
  categoriaId: string;
  cartaoId: string;
  status: string;
  period: import('../../../../shared/utils/period-filter.util').PeriodFilter;
}
