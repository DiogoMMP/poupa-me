import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransacaoModel } from '../../../features/transacoes/models/transacoes.model';
import { formatData } from '../../utils/date-formatter.util';

/**
 * Componente de item de transação individual para exibição em listas de extratos, relatórios ou paginação.
 * Suporta formatação de valores positivos/negativos, estado de conclusão, edição de rota e botões de ação.
 *
 * @example
 * ```html
 * <app-transacao-item [transacao]="item" [showActions]="true" (deleted)="onDelete($event)">
 * </app-transacao-item>
 * ```
 */
@Component({
  selector: 'app-transacao-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transacao-item.component.html',
  styleUrls: ['./transacao-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TransacaoItemComponent {
  /**
   * Objeto com os dados da transação (descrição, valor, data, tipo, etc.).
   */
  @Input({ required: true }) transacao!: TransacaoModel;

  /**
   * Controla a exibição do bloco de ações interativas (botões de edição e eliminação).
   */
  @Input() showActions = true;

  /**
   * Define se o estado de reconciliação ou status da transação deve ser visível.
   */
  @Input() showStatus = true;

  /**
   * Ativa o botão de ação rápida para marcar transação pendente como concluída.
   */
  @Input() showConcluir = false;

  /**
   * Indica se o item está num estado de carregamento/processamento assíncrono (ex: a ser eliminado).
   */
  @Input() isBusy = false;

  /**
   * Prefixo do caminho de navegação de edição (ao qual será anexado o `id` da transação).
   */
  @Input() editRoutePrefix = '/transacoes/editar';

  /**
   * Substituição de estilo de ícone/cor para transações marcadas como concluídas/pagas.
   */
  @Input() iconOverride?: 'concluido';

  /**
   * Evento emitido ao solicitar a eliminação da transação atual.
   */
  @Output() deleted = new EventEmitter<TransacaoModel>();

  /**
   * Evento emitido ao marcar a transação como concluída.
   */
  @Output() concluido = new EventEmitter<TransacaoModel>();

  readonly formatData = formatData;

  /**
   * Determina se o valor deve ter destaque visual positivo (`Entrada` ou `Reembolso`).
   */
  get isPositive(): boolean {
    const t = this.transacao.tipo;
    return t === 'Entrada' || t === 'Reembolso';
  }

  /**
   * Classe CSS correspondente ao tipo da transação para estilização do ícone.
   */
  get iconClass(): string {
    if (this.iconOverride === 'concluido') return 'concluido-icon';
    return this.isPositive ? 'entradas-icon' : 'saidas-icon';
  }

  /**
   * Manipulador do clique para emitir o evento de exclusão.
   */
  onDelete(): void {
    this.deleted.emit(this.transacao);
  }

  /**
   * Manipulador do clique para emitir o evento de conclusão.
   */
  onConcluir(): void {
    this.concluido.emit(this.transacao);
  }
}
