import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription, forkJoin } from 'rxjs';
import { TransacoesService } from '../../services/transacoes.service';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { CartoesCreditoService } from '../../../cartoes-credito/services/cartoes-credito.service';
import { ContasService } from '../../../contas/services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { TransacoesMapper } from '../../mappers/transacoes.mapper';
import { TransacaoModel } from '../../models/transacoes.model';
import { TransacoesDTO } from '../../dto/transacoes.dto';
import { PaginatedDTO } from '../../../../shared/dto/paginated.dto';
import { CategoriasDTO } from '../../../categorias/dto/categorias.dto';
import { CartoesCreditoModel } from '../../../cartoes-credito/models/cartoes-credito.model';
import { CartoesCreditoMapper } from '../../../cartoes-credito/mappers/cartoes-credito.mapper';
import { ContasModel } from '../../../contas/models/contas.model';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';
import { ContaFilters, CartaoFilters } from './transacoes-listar.filter';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '../../../../shared/components/pagination/pagination.component';

export type { PeriodFilter, ContaFilters, CartaoFilters } from './transacoes-listar.filter';

/**
 * Uma página de transações já mapeada para o modelo do frontend.
 */
export interface TransacoesPage {
  items: TransacaoModel[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

const emptyPage = (pageSize: number = DEFAULT_PAGE_SIZE): TransacoesPage => ({
  items: [], page: 1, pageSize, totalPages: 0, totalItems: 0
});

const toPage = (dto: PaginatedDTO<TransacoesDTO>): TransacoesPage => ({
  items: TransacoesMapper.toModelArray(dto.items),
  page: dto.page,
  pageSize: dto.pageSize,
  totalPages: dto.totalPages,
  totalItems: dto.totalItems
});

@Injectable()
export class TransacoesListViewModel {
  private transacoesService = inject(TransacoesService);
  private categoriasService = inject(CategoriasService);
  private cartoesService = inject(CartoesCreditoService);
  private contasService = inject(ContasService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  readonly contaPage$ = new BehaviorSubject<TransacoesPage>(emptyPage());
  readonly cartaoPage$ = new BehaviorSubject<TransacoesPage>(emptyPage());

  readonly cartoes$ = new BehaviorSubject<CartoesCreditoModel[]>([]);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasDTO[]>([]);

  contaFilters: ContaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
  cartaoFilters: CartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };

  readonly PERIODS = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'] as const;
  readonly STATUSES = ['Pendente', 'Concluído'];
  readonly PAGE_SIZE_OPTIONS = DEFAULT_PAGE_SIZE_OPTIONS;

  private contaPage = 1;
  private contaPageSize = DEFAULT_PAGE_SIZE;
  private cartaoPage = 1;
  private cartaoPageSize = DEFAULT_PAGE_SIZE;

  private allSub?: Subscription;
  private contaSub?: Subscription;
  private cartaoSub?: Subscription;

  constructor() {
    this.selectedBanco.selectedBancoId$.subscribe(() => this.loadAll());
  }

  get bancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  /**
   * Load all supporting data (categories, cards, accounts) and refresh lists from the first page
   */
  loadAll(): void {
    this.allSub?.unsubscribe();
    this.contaSub?.unsubscribe();
    this.cartaoSub?.unsubscribe();
    this.isLoading$.next(true);
    this.contaPage = 1;
    this.cartaoPage = 1;
    const bancoId = this.bancoId ?? undefined;

    if (!bancoId) {
      this.categorias$.next([]);
      this.cartoes$.next([]);
      this.contas$.next([]);
      this.contaPage$.next(emptyPage(this.contaPageSize));
      this.cartaoPage$.next(emptyPage(this.cartaoPageSize));
      this.isLoading$.next(false);
      return;
    }

    this.allSub = forkJoin({
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
   * Load the current page of the account column, sending every active filter to the API
   */
  loadContaTransacoes(): void {
    this.contaSub?.unsubscribe();
    const bancoId = this.bancoId ?? undefined;

    if (!bancoId) {
      this.contaPage$.next(emptyPage(this.contaPageSize));
      this.isLoading$.next(false);
      return;
    }

    const f = this.contaFilters;
    this.contaSub = this.transacoesService.getContaTransactionsPage(
      { bancoId, contaId: f.contaId, categoriaId: f.categoriaId, period: f.period },
      this.contaPage,
      this.contaPageSize
    ).subscribe({
      next: dto => {
        // Page beyond the end (e.g. last item of the last page was deleted): go to the last page
        if (dto.items.length === 0 && dto.totalPages > 0 && dto.page > dto.totalPages) {
          this.contaPage = dto.totalPages;
          this.loadContaTransacoes();
          return;
        }
        this.contaPage$.next(toPage(dto));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar transações de conta');
        this.isLoading$.next(false);
      }
    });
  }

  setContaPage(page: number): void {
    this.contaPage = page;
    this.loadContaTransacoes();
  }

  setContaPageSize(pageSize: number): void {
    this.contaPageSize = pageSize;
    this.contaPage = 1;
    this.loadContaTransacoes();
  }

  applyContaFilters(filters: ContaFilters): void {
    this.contaFilters = { ...filters };
    this.contaPage = 1;
    this.loadContaTransacoes();
  }

  clearContaFilters(): void {
    this.contaFilters = { categoriaId: '', contaId: '', period: 'Este Mês' };
    this.contaPage = 1;
    this.loadContaTransacoes();
  }

  // ── Cartão column ─────────────────────────────────────────

  /**
   * Load the current page of the credit-card column, sending every active filter to the API
   */
  loadCartaoTransacoes(): void {
    this.cartaoSub?.unsubscribe();
    const bancoId = this.bancoId ?? undefined;

    if (!bancoId) {
      this.cartaoPage$.next(emptyPage(this.cartaoPageSize));
      this.isLoading$.next(false);
      return;
    }

    const f = this.cartaoFilters;
    this.cartaoSub = this.transacoesService.getCartaoTransactionsPage(
      { bancoId, cartaoCreditoId: f.cartaoId, categoriaId: f.categoriaId, status: f.status, period: f.period },
      this.cartaoPage,
      this.cartaoPageSize
    ).subscribe({
      next: dto => {
        // Page beyond the end (e.g. last item of the last page was deleted): go to the last page
        if (dto.items.length === 0 && dto.totalPages > 0 && dto.page > dto.totalPages) {
          this.cartaoPage = dto.totalPages;
          this.loadCartaoTransacoes();
          return;
        }
        this.cartaoPage$.next(toPage(dto));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar transações de cartão');
        this.isLoading$.next(false);
      }
    });
  }

  setCartaoPage(page: number): void {
    this.cartaoPage = page;
    this.loadCartaoTransacoes();
  }

  setCartaoPageSize(pageSize: number): void {
    this.cartaoPageSize = pageSize;
    this.cartaoPage = 1;
    this.loadCartaoTransacoes();
  }

  applyCartaoFilters(filters: CartaoFilters): void {
    this.cartaoFilters = { ...filters };
    this.cartaoPage = 1;
    this.loadCartaoTransacoes();
  }

  clearCartaoFilters(): void {
    this.cartaoFilters = { categoriaId: '', cartaoId: '', status: '', period: 'Este Mês' };
    this.cartaoPage = 1;
    this.loadCartaoTransacoes();
  }

  // ── Helpers ───────────────────────────────────────────────

  /**
   * Return whether there are any cards available
   */
  hasCartoes(): boolean {
    return this.cartoes$.getValue().length > 0;
  }

  /**
   * Delete a transaction by its domain id.
   * Calls API, reloads the current page of the column that held it and notifies the user.
   */
  public deleteTransacao(transacaoId: string): void {
    if (!transacaoId) return;
    this.isLoading$.next(true);
    const inConta = this.contaPage$.getValue().items.some(t => t.id === transacaoId);
    const inCartao = this.cartaoPage$.getValue().items.some(t => t.id === transacaoId);
    this.transacoesService.delete(transacaoId).subscribe({
      next: () => {
        this.notification.success('Transação eliminada com sucesso');
        if (inConta) this.loadContaTransacoes();
        if (inCartao) this.loadCartaoTransacoes();
        if (!inConta && !inCartao) this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[TransacoesListViewModel] deleteTransacao error', err);
        this.notification.error('Falha ao eliminar transação');
        this.isLoading$.next(false);
      }
    });
  }
}
