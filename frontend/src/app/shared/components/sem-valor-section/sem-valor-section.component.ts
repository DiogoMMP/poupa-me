import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DespesaRecorrenteModel } from '../../../features/despesas-recorrentes/models/despesas-recorrentes.model';

/**
 * Secção de destaque de alertas/itens sem valor definido (ex: despesas recorrentes pendentes de atribuição de montante).
 *
 * @example
 * ```html
 * <app-sem-valor-section label="Pendente de Valor" [items]="lista" (itemClicked)="abrirEdicao($event)">
 * </app-sem-valor-section>
 * ```
 */
@Component({
  selector: 'app-sem-valor-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sem-valor-section.component.html',
  styleUrls: ['./sem-valor-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SemValorSectionComponent {
  /**
   * Rótulo ou título da secção de alerta.
   */
  @Input({ required: true }) label = '';

  /**
   * Lista de despesas recorrentes que não possuem valor financeiro registado (`temValor: false`).
   */
  @Input() items: DespesaRecorrenteModel[] | null = null;

  /**
   * Evento emitido quando o utilizador clica em um dos itens da secção para o editar ou resolver.
   */
  @Output() itemClicked = new EventEmitter<DespesaRecorrenteModel>();

  /**
   * Manipulador do clique no item de despesa recorrente.
   */
  onClick(item: DespesaRecorrenteModel): void {
    this.itemClicked.emit(item);
  }
}
