import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesListViewModel, ContaFilters, CartaoFilters } from './transacoes-listar.view-model';
import { TransacaoModel } from '../../models/transacoes.model';
import { formatData } from './transacoes-listar.formatter';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { TransacaoItemComponent } from '../../../../shared/components/transacao-item/transacao-item.component';
import { NovaTransacaoMenuComponent } from '../../../../shared/components/nova-transacao-menu/nova-transacao-menu.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { ToSelectOptionsPipe } from '../../../../shared/pipes/to-select-options.pipe';

@Component({
  selector: 'app-transacoes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TransacaoItemComponent, NovaTransacaoMenuComponent, IconComponent, SelectComponent, ToSelectOptionsPipe],
  templateUrl: './transacoes-listar.component.html',
  styleUrls: ['./transacoes-listar.component.css'],
  providers: [TransacoesListViewModel]
})
export class TransacoesListComponent implements OnInit {
  public vm = inject(TransacoesListViewModel);
  private confirmDialog = inject(ConfirmDialogService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  /** Expose formatter utility directly to the template */
  readonly formatData = formatData;

  // Local form state for filters (bound via ngModel)
  contaFilterForm: ContaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
  cartaoFilterForm: CartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };

  // Toggle filter panels
  showContaFilters = false;
  showCartaoFilters = false;

  ngOnInit(): void {
    this.vm.loadAll();
  }

  // ── Pagination handlers ───────────────────────────────────

  /** Go to another page of the account column and jump to the top of the page */
  onContaPageChange(page: number): void {
    this.scrollToTop();
    this.vm.setContaPage(page);
  }

  /** Go to another page of the card column and jump to the top of the page */
  onCartaoPageChange(page: number): void {
    this.scrollToTop();
    this.vm.setCartaoPage(page);
  }

  /**
   * Scroll instantly to the top. Covers both the window and the layout's `main.content`, since either
   * may be the scrolling element depending on the viewport.
   */
  private scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
    this.document.querySelector('main.content')?.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ── Account filters handlers ──────────────────────────────

  /** Apply account filters (the ViewModel goes back to page 1) */
  applyContaFilters(): void {
    this.vm.applyContaFilters({ ...this.contaFilterForm });
  }

  /** Clear account filters */
  clearContaFilters(): void {
    this.contaFilterForm = { categoriaId: '', contaId: '', period: 'Este Mês' };
    this.vm.clearContaFilters();
  }

  // ── Card filters handlers ─────────────────────────────────

  /** Apply card filters (the ViewModel goes back to page 1) */
  applyCartaoFilters(): void {
    this.vm.applyCartaoFilters({ ...this.cartaoFilterForm });
  }

  /** Clear card filters */
  clearCartaoFilters(): void {
    this.cartaoFilterForm = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };
    this.vm.clearCartaoFilters();
  }

  hasActiveContaFilters(): boolean {
    const f = this.contaFilterForm;
    return !!(f.categoriaId || f.contaId || f.period);
  }

  hasActiveCartaoFilters(): boolean {
    const f = this.cartaoFilterForm;
    return !!(f.categoriaId || f.cartaoId || f.status || f.period);
  }

  /**
   * User clicked delete on a transaction — confirm then forward to ViewModel
   * @param t - transaction item
   */
  async onDelete(t: TransacaoModel): Promise<void> {
    if (!t?.id) return;
    const ok = await this.confirmDialog.confirm('Eliminar transação? Esta ação não pode ser desfeita.', { variant: 'danger' });
    if (!ok) return;
    this.vm.deleteTransacao(t.id);
  }
}
