import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { TransacoesService } from '../../../transacoes/services/transacoes.service';
import { TransacoesMapper } from '../../../transacoes/mappers/transacoes.mapper';
import { TransacaoModel } from '../../../transacoes/models/transacoes.model';
import { CategoriasDTO } from '../../../categorias/dto/categorias.dto';
import { DespesasRecorrentesService } from '../../services/despesas-recorrentes.service';
import { DespesasRecorrentesMapper } from '../../mappers/despesas-recorrentes.mapper';
import { DespesaRecorrenteModel } from '../../models/despesas-recorrentes.model';

export type PeriodFilter = 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano' | '';

export interface DespesaFilters {
  categoriaId: string;
  period: PeriodFilter;
}

@Injectable()
export class DespesasRecorrentesListViewModel {
  private transacoesService = inject(TransacoesService);
  private despesasRecorrentesService = inject(DespesasRecorrentesService);
  private categoriasService = inject(CategoriasService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  /** Left column — Pendente */
  readonly pendentes$ = new BehaviorSubject<TransacaoModel[]>([]);
  /** Right column — Concluído */
  readonly concluidas$ = new BehaviorSubject<TransacaoModel[]>([]);
  /** Recurring expense rules without valor/diaDoMes configured */
  readonly despesasSemValor$ = new BehaviorSubject<DespesaRecorrenteModel[]>([]);

  readonly categorias$ = new BehaviorSubject<CategoriasDTO[]>([]);

  pendenteFilters: DespesaFilters = { categoriaId: '', period: '' };
  concluidaFilters: DespesaFilters = { categoriaId: '', period: '' };

  /** Set of transaction ids currently being processed to prevent duplicate clicks */
  private busyIds = new Set<string>();

  readonly PERIODS: PeriodFilter[] = ['Este Mês', 'Últimos 3 Meses', 'Último Ano'];

  constructor() {
    this.selectedBanco.selectedBancoId$.subscribe(() => this.loadAll());
  }

  get bancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  /** Load categories then refresh both columns and sem-valor list */
  loadAll(): void {
    this.isLoading$.next(true);
    this.categoriasService.getAll().subscribe({
      next: cats => {
        this.categorias$.next(cats);
        this.loadPendentes();
        this.loadConcluidas();
        this.loadDespesasSemValor();
      },
      error: err => {
        console.error('[DespesasRecorrentesListViewModel] loadAll error', err);
        this.notification.error('Falha ao carregar dados');
        this.isLoading$.next(false);
      }
    });
  }

  // ── Sem Valor ─────────────────────────────────────────────

  loadDespesasSemValor(): void {
    const bancoId = this.bancoId;
    if (!bancoId) { this.despesasSemValor$.next([]); return; }
    this.despesasRecorrentesService.getSemValor(bancoId).subscribe({
      next: dtos => this.despesasSemValor$.next(DespesasRecorrentesMapper.toModelArray(dtos)),
      error: err => {
        console.error('[DespesasRecorrentesListViewModel] loadDespesasSemValor error', err);
      }
    });
  }

  // ── Pendentes column ──────────────────────────────────────

  loadPendentes(): void {
    const f = this.pendenteFilters;
    const bancoId = this.bancoId ?? undefined;

    // Period filter
    if (f.period && !f.categoriaId) {
      this.transacoesService.getDespesaRecorrenteByPeriod(f.period, bancoId).subscribe({
        next: dtos => {
          this.pendentes$.next(TransacoesMapper.toModelArray(dtos).filter(t => t.status === 'Pendente'));
          this.isLoading$.next(false);
        },
        error: () => { this.notification.error('Falha ao filtrar despesas pendentes'); this.isLoading$.next(false); }
      });
      return;
    }

    // Categoria filter (or both)
    if (f.categoriaId) {
      this.transacoesService.getDespesaRecorrenteByCategoria(f.categoriaId, bancoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos).filter(t => t.status === 'Pendente');
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.pendentes$.next(all);
          this.isLoading$.next(false);
        },
        error: () => { this.notification.error('Falha ao filtrar despesas pendentes'); this.isLoading$.next(false); }
      });
      return;
    }

    // No filter — load by status directly
    this.transacoesService.getDespesaRecorrenteByStatus('Pendente', bancoId).subscribe({
      next: dtos => { this.pendentes$.next(TransacoesMapper.toModelArray(dtos)); this.isLoading$.next(false); },
      error: () => { this.notification.error('Falha ao carregar despesas pendentes'); this.isLoading$.next(false); }
    });
  }

  applyPendenteFilters(filters: DespesaFilters): void {
    this.pendenteFilters = { ...filters };
    this.loadPendentes();
  }

  clearPendenteFilters(): void {
    this.pendenteFilters = { categoriaId: '', period: '' };
    this.loadPendentes();
  }

  // ── Concluídas column ─────────────────────────────────────

  loadConcluidas(): void {
    const f = this.concluidaFilters;
    const bancoId = this.bancoId ?? undefined;

    // Period filter
    if (f.period && !f.categoriaId) {
      this.transacoesService.getDespesaRecorrenteByPeriod(f.period, bancoId).subscribe({
        next: dtos => {
          this.concluidas$.next(TransacoesMapper.toModelArray(dtos).filter(t => t.status === 'Concluído'));
          this.isLoading$.next(false);
        },
        error: () => { this.notification.error('Falha ao filtrar despesas concluídas'); this.isLoading$.next(false); }
      });
      return;
    }

    // Categoria filter (or both)
    if (f.categoriaId) {
      this.transacoesService.getDespesaRecorrenteByCategoria(f.categoriaId, bancoId).subscribe({
        next: dtos => {
          let all = TransacoesMapper.toModelArray(dtos).filter(t => t.status === 'Concluído');
          if (f.period) all = this.filterByPeriod(all, f.period);
          this.concluidas$.next(all);
          this.isLoading$.next(false);
        },
        error: () => { this.notification.error('Falha ao filtrar despesas concluídas'); this.isLoading$.next(false); }
      });
      return;
    }

    // No filter — load by status directly
    this.transacoesService.getDespesaRecorrenteByStatus('Concluído', bancoId).subscribe({
      next: dtos => { this.concluidas$.next(TransacoesMapper.toModelArray(dtos)); this.isLoading$.next(false); },
      error: () => { this.notification.error('Falha ao carregar despesas concluídas'); this.isLoading$.next(false); }
    });
  }

  applyConcluidaFilters(filters: DespesaFilters): void {
    this.concluidaFilters = { ...filters };
    this.loadConcluidas();
  }

  clearConcluidaFilters(): void {
    this.concluidaFilters = { categoriaId: '', period: '' };
    this.loadConcluidas();
  }

  // ── Helpers ───────────────────────────────────────────────

  formatData(dia: number, mes: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dia} ${meses[mes - 1] ?? ''}`;
  }

  private filterByPeriod(items: TransacaoModel[], period: PeriodFilter): TransacaoModel[] {
    if (!period) return items;
    const now = new Date();
    if (period === 'Este Mês') {
      return items.filter(t => t.mes === now.getMonth() + 1 && t.ano === now.getFullYear());
    } else if (period === 'Últimos 3 Meses') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return items.filter(t => {
        const d = new Date(t.ano, t.mes - 1, t.dia);
        return d >= start && d <= now;
      });
    } else if (period === 'Último Ano') {
      const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      return items.filter(t => {
        const d = new Date(t.ano, t.mes - 1, t.dia);
        return d >= start && d <= now;
      });
    }
    return items;
  }

  /**
   * Returns true if the transaction id is currently being processed
   */
  isBusy(id: string): boolean {
    return this.busyIds.has(id);
  }

  /**
   * Conclude a recurring transaction: calls the correct endpoint depending on the transaction type
   * Supports 'Despesa Mensal' and 'Poupança'. Refreshes lists on success.
   */
  concluirTransacao(t: TransacaoModel): void {
    if (!t || !t.id) return;
    if (this.isBusy(t.id)) return;

    // Only allow concluding pending items
    if (t.status !== 'Pendente') {
      this.notification.info('Transaction is not pending');
      return;
    }

    let obs$;
    if (t.tipo === 'Despesa Mensal') {
      obs$ = this.transacoesService.concluirDespesaMensal(t.id);
    } else if (t.tipo === 'Poupança' || t.tipo === 'Poupanca') {
      obs$ = this.transacoesService.concluirPoupanca(t.id);
    } else {
      this.notification.info('Não é possível concluir este tipo de transação');
      return;
    }

    this.busyIds.add(t.id);
    this.isLoading$.next(true);

    obs$.subscribe({
      next: () => {
        this.notification.success('Transação concluída com sucesso');
        // reload both columns to reflect new status
        this.loadPendentes();
        this.loadConcluidas();
        this.busyIds.delete(t.id);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('concluirTransacao error', err);
        this.notification.error('Falha ao concluir transação');
        this.busyIds.delete(t.id);
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Delete a transaction by its domain id.
   * Calls API, removes the transaction from the current lists and notifies the user.
   */
  public deleteTransacao(transacaoId: string): void {
    if (!transacaoId) return;
    if (this.isBusy(transacaoId)) return;

    this.busyIds.add(transacaoId);
    this.isLoading$.next(true);

    this.transacoesService.delete(transacaoId).subscribe({
      next: () => {
        // Remove from pendentes and concluidas lists if present
        this.pendentes$.next(this.pendentes$.getValue().filter(t => t.id !== transacaoId));
        this.concluidas$.next(this.concluidas$.getValue().filter(t => t.id !== transacaoId));

        this.notification.success('Transação eliminada com sucesso');
        this.busyIds.delete(transacaoId);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[DespesasRecorrentesListViewModel] deleteTransacao error', err);
        this.notification.error('Falha ao eliminar transação');
        this.busyIds.delete(transacaoId);
        this.isLoading$.next(false);
      }
    });
  }
}
