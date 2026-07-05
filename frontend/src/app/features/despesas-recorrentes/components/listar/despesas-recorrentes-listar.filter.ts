import { TransacaoModel } from '../../../transacoes/models/transacoes.model';
export type { PeriodFilter } from '../../../../shared/utils/period-filter.util';
export { filterByPeriod } from '../../../../shared/utils/period-filter.util';

export interface DespesaFilters {
  categoriaId: string;
  period: import('../../../../shared/utils/period-filter.util').PeriodFilter;
}
