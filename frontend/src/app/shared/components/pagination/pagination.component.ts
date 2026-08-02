import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de paginação de dados tabulares ou em lista. Calcula o número total de páginas com base no tamanho da página.
 *
 * @example
 * ```html
 * <app-pagination [currentPage]="1" [totalItems]="48" [pageSize]="10" (pageChanged)="onPageChange($event)">
 * </app-pagination>
 * ```
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  /**
   * Número da página atualmente ativa (1-indexed).
   */
  @Input({ required: true }) currentPage = 1;

  /**
   * Total de itens disponíveis na coleção completa para cálculo de páginas.
   */
  @Input({ required: true }) totalItems = 0;

  /**
   * Quantidade máxima de itens por página. Padrão: `10`.
   */
  @Input() pageSize = 10;

  /**
   * Evento emitido quando o utilizador clica em "Anterior" ou "Seguinte" enviando o número da nova página.
   */
  @Output() pageChanged = new EventEmitter<number>();

  /**
   * Retorna o total de páginas calculado a partir do número de itens e tamanho da página.
   */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  /**
   * Retrocede para a página anterior, se existir.
   */
  onPrev(): void {
    if (this.currentPage > 1) {
      this.pageChanged.emit(this.currentPage - 1);
    }
  }

  /**
   * Avança para a próxima página, se existir.
   */
  onNext(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChanged.emit(this.currentPage + 1);
    }
  }
}
