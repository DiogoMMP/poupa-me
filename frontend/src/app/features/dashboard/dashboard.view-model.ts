import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { BancosService } from '../bancos/services/bancos.service';
import { BancosMapper } from '../bancos/mappers/bancos.mapper';
import { BancosModel } from '../bancos/models/bancos.model';
import { DashboardDTO } from '../bancos/dto/dashboard.dto';
import { NotificationService } from '../../services/notification.service';
import { SelectedBancoService } from '../../services/selected-banco.service';
import { ContasService } from '../contas/services/contas.service';
import { ContasMapper } from '../contas/mappers/contas.mapper';
import { ContasModel } from '../contas/models/contas.model';

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
  private notification = inject(NotificationService);
  private selectedBancoService = inject(SelectedBancoService);

  readonly bancos$ = new BehaviorSubject<BancosModel[]>([]);
  readonly dashboard$ = new BehaviorSubject<DashboardDTO | null>(null);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);
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
}
