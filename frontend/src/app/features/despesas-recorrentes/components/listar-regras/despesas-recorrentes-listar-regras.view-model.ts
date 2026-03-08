import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DespesasRecorrentesService } from '../../services/despesas-recorrentes.service';
import { NotificationService } from '../../../../services/notification.service';
import { DespesasRecorrentesMapper } from '../../mappers/despesas-recorrentes.mapper';
import { DespesaRecorrenteModel } from '../../models/despesas-recorrentes.model';
import { SelectedBancoService } from '../../../../services/selected-banco.service';

/**
 * ViewModel for the despesas recorrentes list component.
 */
@Injectable()
export class DespesasRecorrentesListarRegrasViewModel {
  private service = inject(DespesasRecorrentesService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly regras$ = new BehaviorSubject<DespesaRecorrenteModel[]>([]);

  constructor() {
    // Reload when selected bank changes
    this.selectedBanco.selectedBancoId$.subscribe(() => this.loadData());
  }

  get bancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  /**
   * Loads the list of despesas recorrentes regras. This method is called when the component initializes and can be
   * called again to refresh the data.
   */
  loadData(): void {
    this.isLoading$.next(true);
    const bancoId = this.bancoId ?? undefined;
    this.service.getAll(bancoId).subscribe({
      next: (dtos) => {
        this.regras$.next(DespesasRecorrentesMapper.toModelArray(dtos));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar regras');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes uma despesa recorrente regra by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the despesa recorrente regra to delete
   */
  deleteRegra(id: string): void {
    if (!id) return;
    if (!confirm('Tem a certeza que pretende eliminar esta regra?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Regra eliminada');
        this.loadData();
      },
      error: () => this.notification.error('Falha ao eliminar regra')
    });
  }
}
