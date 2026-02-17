import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { BancosService } from '../../services/bancos.service';
import { NotificationService } from '../../../../services/notification.service';
import { BancosModel } from '../../models/bancos.model';
import { BancosMapper } from '../../mappers/bancos.mapper';
import { DashboardModel } from '../../models/dashboard.model';
import { DashboardMapper } from '../../mappers/dashboard.mapper';
import { AuthService } from '../../../../services/auth.service';

/**
 * ViewModel for the lister component of Bancos. Responsible for loading the list of bancos and their dashboard data.
 * This ViewModel is designed to be used with the BancosListComponent and provides all necessary data and actions for that component.
 */
@Injectable()
export class BancosListViewModel {
  private service = inject(BancosService);
  private notification = inject(NotificationService);
  public auth = inject(AuthService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly bancos$ = new BehaviorSubject<BancosModel[]>([]);
  readonly dashboard$ = new BehaviorSubject<DashboardModel | null>(null);

  /**
   * Loads the list of bancos and their dashboard data. This method is called when the component initializes and can be
   * called again to refresh the data.
   */
  loadData(): void {
    this.isLoading$.next(true);

    // First load list of banks
    this.service.getAll().subscribe({
      next: (dtos) => {
        const models = BancosMapper.toModelArray(dtos);
        this.bancos$.next(models);

        // If there are banks, load dashboards for all banks
        if (models.length > 0) {
          this.loadDashboardsForAllBancos(models);
        } else {
          this.isLoading$.next(false);
        }
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar Bancos');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes a banco by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the banco to delete
   */
  deleteBanco(id: string): void {
    if (!id) return;

    // simple confirmation
    if (!confirm('Tem a certeza que pretende eliminar este banco?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Banco eliminado');
        this.loadData();
      },
      error: (err) => {
        console.error('[FRONTEND] BancosListViewModel.deleteBanco - Error:', err);
        this.notification.error('Falha ao eliminar banco');
      }
    });
  }

  /**
   * Returns the dashboard detail item for the provided banco id if loaded
   */
  getDetalhe(bancoId: string) {
    const dash = this.dashboard$.getValue();
    if (!dash) return undefined;
    return dash.detalhePorBanco.find(d => d.id === bancoId);
  }

  private loadDashboardsForAllBancos(bancos: BancosModel[]): void {
    // Create array of observables - one for each bank
    const dashboardRequests = bancos.map(banco =>
      this.service.getDashboardData(banco.id)
    );

    // Execute all requests in parallel
    forkJoin(dashboardRequests).subscribe({
      next: (dashboardDtos) => {
        // Combine all dashboards into a single model
        const saldoGlobal = dashboardDtos.reduce((total, dto) => total + dto.saldoGlobal, 0);
        const detalhePorBanco = dashboardDtos.flatMap(dto => dto.detalhePorBanco);

        const dashboardCombinado: DashboardModel = {
          saldoGlobal,
          detalhePorBanco: detalhePorBanco.map(detalhe => DashboardMapper.detalheBancoToModel(detalhe))
        };

        this.dashboard$.next(dashboardCombinado);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar dados do Dashboard');
        this.isLoading$.next(false);
      }
    });
  }
}
