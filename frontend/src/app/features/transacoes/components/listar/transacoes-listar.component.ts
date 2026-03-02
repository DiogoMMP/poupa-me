import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesListViewModel, ContaFilters, CartaoFilters } from './transacoes-listar.view-model';
import { TransacaoModel } from '../../models/transacoes.model';

const PAGE_SIZE = 10; // items per page

@Component({
  selector: 'app-transacoes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transacoes-listar.component.html',
  styleUrls: ['./transacoes-listar.component.css'],
  providers: [TransacoesListViewModel]
})
export class TransacoesListComponent implements OnInit {
  public vm = inject(TransacoesListViewModel);

  // Local form state for filters (bound via ngModel)
  contaFilterForm: ContaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
  cartaoFilterForm: CartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };

  // Toggle filter panels
  showContaFilters = false;
  showCartaoFilters = false;

  // Nova Transação dropdown
  showCreateMenu = false;

  contaPage = 1;
  cartaoPage = 1;

  ngOnInit(): void {
    this.vm.loadAll();
  }

  // ── Pagination helpers ────────────────────────────────────

  /**
   * Paginate an array of transactions
   * @param items - transaction array
   * @param page - 1-based page index
   */
  paginate(items: TransacaoModel[], page: number): TransacaoModel[] {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }

  /**
   * Compute total pages for a list
   */
  totalPages(items: TransacaoModel[]): number {
    return Math.ceil(items.length / PAGE_SIZE) || 1;
  }

  // ── Account filters handlers ──────────────────────────────

  /** Apply account filters and reset page */
  applyContaFilters(): void {
    this.contaPage = 1;
    this.vm.applyContaFilters({ ...this.contaFilterForm });
  }

  /** Clear account filters */
  clearContaFilters(): void {
    this.contaPage = 1;
    this.contaFilterForm = { categoriaId: '', contaId: '', period: 'Este Mês' };
    this.vm.clearContaFilters();
  }

  // ── Card filters handlers ─────────────────────────────────

  /** Apply card filters and reset page */
  applyCartaoFilters(): void {
    this.cartaoPage = 1;
    this.vm.applyCartaoFilters({ ...this.cartaoFilterForm });
  }

  /** Clear card filters */
  clearCartaoFilters(): void {
    this.cartaoPage = 1;
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
  onDelete(t: TransacaoModel): void {
    if (!t?.id) return;
    const ok = confirm('Eliminar transação? Esta ação não pode ser desfeita.');
    if (!ok) return;
    this.vm.deleteTransacao(t.id);
  }

  toggleCreateMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showCreateMenu = !this.showCreateMenu;
  }

  @HostListener('document:click')
  closeCreateMenu(): void {
    this.showCreateMenu = false;
  }
}
