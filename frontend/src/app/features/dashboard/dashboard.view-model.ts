import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BancosService } from '../bancos/services/bancos.service';
import { BancosMapper } from '../bancos/mappers/bancos.mapper';
import { BancosModel } from '../bancos/models/bancos.model';
import { DashboardDTO } from '../bancos/dto/dashboard.dto';
import { NotificationService } from '../../services/notification.service';

/**
 * Lightweight ViewModel for the Dashboard component.
 * Responsibilities:
 * - load bancos list (id, nome, icon)
 * - load dashboard data for a selected banco
 * - expose observables for the component to bind to
 */
@Injectable()
export class DashboardViewModel {
  private bancosService = inject(BancosService);
  private notification = inject(NotificationService);

  readonly bancos$ = new BehaviorSubject<BancosModel[]>([]);
  readonly dashboard$ = new BehaviorSubject<DashboardDTO | null>(null);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  private selectedBancoId: string | null = null;

  loadBancos(): void {
    this.bancosService.getAll().subscribe({
      next: (dtos) => {
        const models = BancosMapper.toModelArray(dtos);
        this.bancos$.next(models);
      },
      error: (err) => {
        console.error('[FRONTEND] DashboardViewModel.loadBancos -', err);
        this.notification.error('Falha ao carregar bancos');
        this.bancos$.next([]);
      }
    });
  }

  selectBanco(id: string | null): void {
    this.selectedBancoId = id;
    if (!id) {
      this.dashboard$.next(null);
      return;
    }

    this.isLoading$.next(true);
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
  }
}
