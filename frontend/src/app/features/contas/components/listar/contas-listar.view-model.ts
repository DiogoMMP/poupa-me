import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ContasService } from '../../services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { ContasModel } from '../../models/contas.model';
import { ContasMapper } from '../../mappers/contas.mapper';
import { AuthService } from '../../../../services/auth.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';

/**
 * ViewModel for the lister component of Contas. Responsible for loading the list of contas
 * filtered by the banco selected in the header.
 */
@Injectable()
export class ContasListViewModel {
  private service = inject(ContasService);
  private notification = inject(NotificationService);
  public auth = inject(AuthService);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);

  /**
   * Expose whether a banco is selected for template checks (e.g., show create button)
   */
  get hasBancoSelected(): boolean {
    return !!this.selectedBanco.currentBancoId;
  }

  constructor() {
    // Recarregar automaticamente sempre que o banco selecionado mudar
    this.selectedBanco.selectedBancoId$.subscribe(bancoId => {
      this.loadData(bancoId);
    });
  }

  /**
   * Loads contas for the optionally provided bancoId. If bancoId is undefined/null, it will
   * clear the list (or optionally load all contas if that is desired).
   */
  loadData(bancoId?: string | null): void {
    this.isLoading$.next(true);

    // If no banco selected, clear list and stop
    if (!bancoId) {
      this.contas$.next([]);
      this.isLoading$.next(false);
      return;
    }

    // Load contas filtered by bancoId
    this.service.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = ContasMapper.toModelArray(dtos);
        this.contas$.next(models);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar Contas');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes a conta by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the conta to delete
   */
  deleteConta(id: string): void {
    if (!id) return;

    // simple confirmation
    if (!confirm('Tem a certeza que pretende eliminar esta Conta?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Conta eliminada');
        // reload current banco selection
        this.loadData(this.selectedBanco.currentBancoId);
      },
      error: (err) => {
        console.error('[FRONTEND] ContasListViewModel.deleteConta - Error:', err);
        this.notification.error('Falha ao eliminar conta');
      }
    });
  }
}
