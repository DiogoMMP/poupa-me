import { Pipe, PipeTransform } from '@angular/core';
import { AppSelectOption } from '../components/select/select.component';

interface EntityWithIconENome {
  id?: string;
  icon?: string;
  nome: string;
}

/**
 * Converte uma lista de entidades `{id, icon, nome}` (ex.: `ContasDTO[]`, `CategoriasDTO[]`,
 * `CartoesCreditoDTO[]`) ou uma lista simples de strings num array de `AppSelectOption`, para usar
 * diretamente no `[options]` do `<app-select>`.
 *
 * @example
 * ```html
 * <app-select [options]="vm.contas$ | async | toSelectOptions" formControlName="contaId"></app-select>
 * <app-select [options]="vm.contas$ | async | toSelectOptions:false" formControlName="contaId"></app-select> <!-- sem ícone -->
 * <app-select [options]="vm.PERIODS | toSelectOptions" [(ngModel)]="filterForm.period"></app-select>
 * <app-select [options]="vm.contas$ | async | toSelectOptions:true:'Nenhuma / Selecionar conta'" formControlName="contaId"></app-select> <!-- com opção vazia real -->
 * ```
 */
@Pipe({ name: 'toSelectOptions', standalone: true })
export class ToSelectOptionsPipe implements PipeTransform {
  transform(
    items: readonly (EntityWithIconENome | string)[] | null | undefined,
    withIcon = true,
    emptyLabel?: string
  ): AppSelectOption[] {
    const mapped = (items ?? []).map(item => {
      if (typeof item === 'string') {
        return { value: item, label: item };
      }
      return {
        value: item.id,
        label: withIcon && item.icon ? `${item.icon} ${item.nome}` : item.nome
      };
    });
    return emptyLabel ? [{ value: '', label: emptyLabel }, ...mapped] : mapped;
  }
}
