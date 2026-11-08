import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSelectOption, SelectComponent } from '../select/select.component';

/** Tamanhos de página disponíveis por omissão (os mesmos que a API aceita). */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Tamanho de página usado por omissão (o mesmo que a API usa quando não recebe `pageSize`). */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Componente de paginação de dados tabulares ou em lista, com seletor de itens por página.
 * O número de páginas pode vir da API (`totalPages`) ou ser calculado a partir de `totalItems`/`pageSize`.
 *
 * @example
 * ```html
 * <app-pagination [currentPage]="1" [totalItems]="48" [pageSize]="10"
 *   (pageChanged)="onPageChange($event)" (pageSizeChanged)="onPageSizeChange($event)">
 * </app-pagination>
 * ```
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
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
   * Total de itens disponíveis na coleção completa.
   */
  @Input({ required: true }) totalItems = 0;

  /**
   * Quantidade máxima de itens por página. Padrão: `25`.
   */
  @Input() pageSize = DEFAULT_PAGE_SIZE;

  /**
   * Total de páginas, quando já vem calculado (p.ex. da API). Se omitido, é calculado a partir de
   * `totalItems` e `pageSize`.
   */
  @Input('totalPages') totalPagesInput?: number;

  /**
   * Tamanhos de página que o utilizador pode escolher. Padrão: `[10, 25, 50, 100]`.
   */
  @Input() set pageSizeOptions(value: number[]) {
    this.sizeOptions = (value ?? []).map(n => ({ value: n, label: `${n}` }));
  }

  /**
   * Evento emitido quando o utilizador clica em "Anterior" ou "Seguinte" enviando o número da nova página.
   */
  @Output() pageChanged = new EventEmitter<number>();

  /**
   * Evento emitido quando o utilizador escolhe outro número de itens por página.
   */
  @Output() pageSizeChanged = new EventEmitter<number>();

  sizeOptions: AppSelectOption[] = DEFAULT_PAGE_SIZE_OPTIONS.map(n => ({ value: n, label: `${n}` }));

  /**
   * Retorna o total de páginas (o recebido, ou calculado a partir do número de itens e tamanho da página).
   */
  get totalPages(): number {
    const total = this.totalPagesInput ?? Math.ceil(this.totalItems / this.pageSize);
    return total || 1;
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

  /**
   * Emite o novo tamanho de página escolhido, se for diferente do atual.
   */
  onPageSizeChange(size: number): void {
    if (size && size !== this.pageSize) {
      this.pageSizeChanged.emit(size);
    }
  }
}
