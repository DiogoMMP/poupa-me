import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, forkJoin } from 'rxjs';
import { BancosService } from '../bancos/services/bancos.service';
import { BancosMapper } from '../bancos/mappers/bancos.mapper';
import { BancosModel } from '../bancos/models/bancos.model';
import { DashboardDTO } from '../bancos/dto/dashboard.dto';
import { NotificationService } from '../../services/notification.service';
import { SelectedBancoService } from '../../services/selected-banco.service';
import { ContasService } from '../contas/services/contas.service';
import { ContasMapper } from '../contas/mappers/contas.mapper';
import { ContasModel } from '../contas/models/contas.model';
import { CartoesCreditoService } from '../cartoes-credito/services/cartoes-credito.service';
import { CartoesCreditoMapper } from '../cartoes-credito/mappers/cartoes-credito.mapper';
import { CartoesCreditoModel } from '../cartoes-credito/models/cartoes-credito.model';
import { TransacoesService } from '../transacoes/services/transacoes.service';
import { TransacoesMapper } from '../transacoes/mappers/transacoes.mapper';
import { TransacaoModel } from '../transacoes/models/transacoes.model';

/**
 * Lightweight ViewModel for the Dashboard component.
 * Responsibilities:
 * - load bancos list (id, nome, icon)
 * - load dashboard data for a selected banco
 * - load contas for the selected banco
 * - expose observables for the component to bind to
 */
@Injectable()
export class DashboardViewModel {
  private bancosService = inject(BancosService);
  private contasService = inject(ContasService);
  private cartoesService = inject(CartoesCreditoService);
  private transacoesService = inject(TransacoesService);
  private notification = inject(NotificationService);
  private selectedBancoService = inject(SelectedBancoService);

  readonly bancos$ = new BehaviorSubject<BancosModel[]>([]);
  readonly dashboard$ = new BehaviorSubject<DashboardDTO | null>(null);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);
  readonly cartoes$ = new BehaviorSubject<CartoesCreditoModel[]>([]);
  readonly transacoes$ = new BehaviorSubject<TransacaoModel[]>([]);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  private selectedBancoId: string | null = null;

  /**
   * Observable that emits true when a banco is selected for conditional rendering
   */
  readonly hasBancoSelected$ = this.selectedBancoService.selectedBancoId$.pipe(
    map(id => !!id)
  );

  constructor() {
    // Subscribe to global banco selection changes
    this.selectedBancoService.selectedBancoId$.subscribe(id => {
      this.selectBanco(id);
    });
  }

  loadBancos(): void {
    this.bancosService.getAll().subscribe({
      next: (dtos) => {
        const models = BancosMapper.toModelArray(dtos);
        this.bancos$.next(models);

        // Validate that the stored banco ID belongs to the loaded list.
        // If not (e.g. different user logged in), clear the stale selection
        // so the dashboard stays empty until the user manually picks a banco.
        const storedId = this.selectedBancoService.currentBancoId;
        if (storedId && !models.some(b => b.id === storedId)) {
          this.selectedBancoService.clearSelection();
        }
      },
      error: (err: any) => {
        // suppress verbose logging for unauthenticated users
        if (err?.status === 401) {
          this.bancos$.next([]);
          return;
        }

        console.error('[FRONTEND] DashboardViewModel.loadBancos -', err?.message || err);
        this.notification.error('Falha ao carregar bancos');
        this.bancos$.next([]);
      }
    });
  }

  selectBanco(id: string | null): void {
    this.selectedBancoId = id;
    if (!id) {
      this.dashboard$.next(null);
      this.contas$.next([]);
      this.cartoes$.next([]);
      this.transacoes$.next([]);
      return;
    }

    this.isLoading$.next(true);

    // Load dashboard data
    this.bancosService.getDashboardData(id).subscribe({
      next: (dto) => {
        this.dashboard$.next(dto);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[FRONTEND] DashboardViewModel.selectBanco -', err);
        this.notification.error('Falha ao carregar dados do banco');
        this.isLoading$.next(false);
      }
    });

    // Load contas for the selected banco
    this.loadContas(id);

    // Load cartoes for the selected banco
    this.loadCartoes(id);

    // Load 5 most recent transactions for the selected banco
    this.loadTransacoes(id);
  }

  private loadContas(bancoId: string): void {
    this.contasService.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = ContasMapper.toModelArray(dtos);
        this.contas$.next(models);
      },
      error: (err) => {
        console.error('[FRONTEND] DashboardViewModel.loadContas -', err);
        this.contas$.next([]);
      }
    });
  }

  private loadCartoes(bancoId: string): void {
    this.cartoesService.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = CartoesCreditoMapper.toModelArray(dtos);
        // Emit initial card list
        this.cartoes$.next(models);

        // Load extrato for each card to get saldoAtual (used for percent calculation)
        try {
          const extratoRequests = models.map(c => this.cartoesService.getExtrato(c.id));
          forkJoin(extratoRequests).subscribe({
            next: (extratos) => {
              extratos.forEach((extrato, index) => {
                const cartao = models[index];
                const saldoAtual = extrato?.saldoAtual?.valor;
                const moeda = extrato?.saldoAtual?.moeda;
                if (typeof saldoAtual === 'number') {
                  // update the model's saldoUtilizado to reflect the extrato.saldoAtual
                  cartao.saldoUtilizado = { valor: saldoAtual, moeda: moeda || cartao.saldoUtilizado.moeda };
                }
              });
              // emit updated models
              this.cartoes$.next([...models]);
            },
            error: (err) => {
              // If extrato loading fails, still show cartões with existing saldoUtilizado
              console.error('[FRONTEND] DashboardViewModel.loadCartoes - extrato fetch failed', err);
            }
          });
        } catch (e) {
          // ignore
        }
      },
      error: (err) => {
        console.error('[FRONTEND] DashboardViewModel.loadCartoes -', err);
        this.cartoes$.next([]);
      }
    });
  }

  private loadTransacoes(bancoId: string): void {
    this.transacoesService.getAllByBanco(bancoId).subscribe({
      next: (dtos) => {
        const models = TransacoesMapper.toModelArray(dtos);
        this.transacoes$.next(models);
      },
      error: (err) => {
        console.error('[FRONTEND] DashboardViewModel.loadTransacoes -', err);
        this.transacoes$.next([]);
      }
    });
  }

  private readonly MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  formatData(dia: number, mes: number): string {
    const nomeMes = this.MESES[(mes - 1)] ?? '';
    return `${dia} ${nomeMes}`;
  }

  /**
   * Compute percentage of credit limit used for a cartao.
   * Returns integer 0..100.
   */
  getPercentagemUtilizada(cartao: CartoesCreditoModel): number {
    if (!cartao) return 0;
    const limite = cartao.limiteCredito?.valor ?? 0;
    const saldo = cartao.saldoUtilizado?.valor ?? 0;
    if (!limite || limite === 0) return 0;
    let percent = (saldo / limite) * 100;
    if (!isFinite(percent) || isNaN(percent)) return 0;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    return Math.round(percent);
  }
}
