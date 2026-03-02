import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { TransacoesService } from '../../services/transacoes.service';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { CartoesCreditoService } from '../../../cartoes-credito/services/cartoes-credito.service';
import { ContasService } from '../../../contas/services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { TransacoesMapper } from '../../mappers/transacoes.mapper';
import { TransacaoModel } from '../../models/transacoes.model';
import { CategoriasDTO } from '../../../categorias/dto/categorias.dto';
import { CartoesCreditoModel } from '../../../cartoes-credito/models/cartoes-credito.model';
import { CartoesCreditoMapper } from '../../../cartoes-credito/mappers/cartoes-credito.mapper';
import { ContasModel } from '../../../contas/models/contas.model';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';

export type PeriodFilter = 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano' | '';

export interface ContaFilters {
  categoriaId: string;
  contaId: string;
  period: PeriodFilter;
}

export interface CartaoFilters {
  categoriaId: string;
  cartaoId: string;
  status: string;
  period: PeriodFilter;
}

@Injectable()
export class TransacoesListViewModel {
  private transacoesService = inject(TransacoesService);
  private categoriasService = inject(CategoriasService);
  private cartoesService = inject(CartoesCreditoService);
  private contasService = inject(ContasService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  readonly contaTransacoes$ = new BehaviorSubject<TransacaoModel[]>([]);
  readonly cartaoTransacoes$ = new BehaviorSubject<TransacaoModel[]>([]);

  readonly cartoes$ = new BehaviorSubject<CartoesCreditoModel[]>([]);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasDTO[]>([]);

  contaFilters: ContaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
  cartaoFilters: CartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };

  readonly PERIODS: PeriodFilter[] = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];
  readonly STATUSES = ['Pendente', 'Concluído'];

  constructor() {
    this.selectedBanco.selectedBancoId$.subscribe(() => this.loadAll());
  }

  get bancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  /**
   * Load all supporting data (categories, cards, accounts) and refresh lists
   */
  loadAll(): void {
    this.isLoading$.next(true);
    const bancoId = this.bancoId ?? undefined;

    forkJoin({
      categorias: this.categoriasService.getAll(),
      cartoes: this.cartoesService.getAll(bancoId),
      contas: this.contasService.getAll(bancoId)
    }).subscribe({
      next: ({ categorias, cartoes, contas }) => {
        this.categorias$.next(categorias);
        this.cartoes$.next(CartoesCreditoMapper.toModelArray(cartoes));
        this.contas$.next(ContasMapper.toModelArray(contas));
        this.loadContaTransacoes();
        this.loadCartaoTransacoes();
      },
      error: (err) => {
        console.error('[TransacoesListViewModel] loadAll error', err);
        this.notification.error('Falha ao carregar dados');
        this.isLoading$.next(false);
      }
    });
  }

  // ── Conta column ──────────────────────────────────────────

  /**
   * Load transactions for the account column based on current filters
   */
  loadContaTransacoes(): void {
    const f = this.contaFilters;
    const bancoId = this.bancoId ?? undefined;

    // Filter by contaId — use the specific conta endpoint
    if (f.contaId) {
      this.transacoesService.getContaTransactions(f.contaId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos);
          if (f.categoriaId) all = all.filter(t => t.categoria.id === f.categoriaId);
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.contaTransacoes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de conta');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // Period filter (server-side)
    if (f.period && !f.categoriaId) {
      this.transacoesService.getContaTransactionsByPeriod(f.period, bancoId).subscribe({
        next: dtos => {
          this.contaTransacoes$.next(TransacoesMapper.toModelArray(dtos));
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de conta');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // Categoria filter (server-side)
    if (f.categoriaId) {
      this.transacoesService.getContaTransactionsByCategoria(f.categoriaId, bancoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos);
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.contaTransacoes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de conta');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // No filter
    this.transacoesService.getAllContaTransactions(bancoId).subscribe({
      next: dtos => {
        this.contaTransacoes$.next(TransacoesMapper.toModelArray(dtos));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar transações de conta');
        this.isLoading$.next(false);
      }
    });
  }

  applyContaFilters(filters: ContaFilters): void {
    this.contaFilters = { ...filters };
    this.loadContaTransacoes();
  }

  clearContaFilters(): void {
    this.contaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
    this.loadContaTransacoes();
  }

  // ── Cartão column ─────────────────────────────────────────

  /**
   * Load transactions for the credit-card column based on current filters
   */
  loadCartaoTransacoes(): void {
    const f = this.cartaoFilters;
    const bancoId = this.bancoId ?? undefined;

    // Filter by cartaoId — use the specific cartao endpoint
    if (f.cartaoId) {
      this.transacoesService.getCartaoTransactions(f.cartaoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos);
          if (f.categoriaId) all = all.filter(t => t.categoria.id === f.categoriaId);
          if (f.status) all = all.filter(t => t.status === f.status);
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.cartaoTransacoes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de cartão');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // Period filter (server-side)
    if (f.period && !f.categoriaId && !f.status) {
      this.transacoesService.getCartaoTransactionsByPeriod(f.period, bancoId).subscribe({
        next: dtos => {
          this.cartaoTransacoes$.next(TransacoesMapper.toModelArray(dtos));
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de cartão');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // Status filter (server-side)
    if (f.status && !f.categoriaId) {
      this.transacoesService.getCartaoTransactionsByStatus(f.status, bancoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos);
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.cartaoTransacoes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de cartão');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // Categoria filter (server-side)
    if (f.categoriaId) {
      this.transacoesService.getCartaoTransactionsByCategoria(f.categoriaId, bancoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos);
          if (f.status) all = all.filter(t => t.status === f.status);
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.cartaoTransacoes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => {
          this.notification.error('Falha ao filtrar transações de cartão');
          this.isLoading$.next(false);
        }
      });
      return;
    }

    // No filter
    this.transacoesService.getAllCartaoTransactions(bancoId).subscribe({
      next: dtos => {
        this.cartaoTransacoes$.next(TransacoesMapper.toModelArray(dtos));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar transações de cartão');
        this.isLoading$.next(false);
      }
    });
  }

  applyCartaoFilters(filters: CartaoFilters): void {
    this.cartaoFilters = { ...filters };
    this.loadCartaoTransacoes();
  }

  clearCartaoFilters(): void {
    this.cartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };
    this.loadCartaoTransacoes();
  }

  // ── Helpers ───────────────────────────────────────────────

  /**
   * Format a day+month into short month name
   */
  formatData(dia: number, mes: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dia} ${meses[mes - 1] ?? ''}`;
  }

  /**
   * Return whether there are any cards available
   */
  hasCartoes(): boolean {
    return this.cartoes$.getValue().length > 0;
  }

  private filterByPeriod(items: TransacaoModel[], period: PeriodFilter): TransacaoModel[] {
    if (!period) return items;
    const now = new Date();
    let startYear = now.getFullYear();
    let startMonth = now.getMonth() + 1;

    if (period === 'Este Mês') {
      return items.filter(t => t.mes === startMonth && t.ano === startYear);
    } else if (period === 'Últimos 3 Meses') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return items.filter(t => {
        const tDate = new Date(t.ano, t.mes - 1, t.dia);
        return tDate >= start && tDate <= now;
      });
    } else if (period === 'Último Ano') {
      const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      return items.filter(t => {
        const tDate = new Date(t.ano, t.mes - 1, t.dia);
        return tDate >= start && tDate <= now;
      });
    }
    return items;
  }

  /**
   * Delete a transaction by its domain id.
   * Calls API, removes the transaction from the current lists and notifies the user.
   */
  public deleteTransacao(transacaoId: string): void {
    if (!transacaoId) return;
    const bancoId = this.bancoId ?? undefined;
    this.isLoading$.next(true);
    this.transacoesService.delete(transacaoId).subscribe({
      next: () => {
        // Remove from contaTransacoes if present
        const contas = this.contaTransacoes$.getValue().filter(t => t.id !== transacaoId);
        this.contaTransacoes$.next(contas);
        // Remove from cartaoTransacoes if present
        const cartoes = this.cartaoTransacoes$.getValue().filter(t => t.id !== transacaoId);
        this.cartaoTransacoes$.next(cartoes);
        this.notification.success('Transação eliminada com sucesso');
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[TransacoesListViewModel] deleteTransacao error', err);
        this.notification.error('Falha ao eliminar transação');
        this.isLoading$.next(false);
      }
    });
  }
}
