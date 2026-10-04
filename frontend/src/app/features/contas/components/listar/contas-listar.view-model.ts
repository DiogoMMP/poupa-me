import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ContasService } from '../../services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { ContasModel } from '../../models/contas.model';
import { ContasMapper } from '../../mappers/contas.mapper';
import { AuthService } from '../../../auth/services/auth.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';

/**
 * ViewModel for the lister component of Contas. Responsible for loading the list of contas
 * filtered by the banco selected in the header.
 */
@Injectable()
export class ContasListViewModel {
  private service = inject(ContasService);
  private notification = inject(NotificationService);
  private confirmDialog = inject(ConfirmDialogService);
  public auth = inject(AuthService);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);

  private loadSub?: Subscription;

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
    this.loadSub?.unsubscribe();
    this.isLoading$.next(true);

    // If no banco selected, clear list and stop
    if (!bancoId) {
      this.contas$.next([]);
      this.isLoading$.next(false);
      return;
    }

    // Load contas filtered by bancoId
    this.loadSub = this.service.getAll(bancoId).subscribe({
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
  async deleteConta(id: string): Promise<void> {
    if (!id) return;

    // simple confirmation
    const confirmed = await this.confirmDialog.confirm('Tem a certeza que pretende eliminar esta Conta?', { variant: 'danger' });
    if (!confirmed) return;

    this.executarDeleteConta(id, false);
  }

  private executarDeleteConta(id: string, cascade: boolean): void {
    this.service.delete(id, cascade).subscribe({
      next: () => {
        this.notification.success('Conta eliminada');
        // reload current banco selection
        this.loadData(this.selectedBanco.currentBancoId);
      },
      error: async (err) => {
        // 409: a conta ainda tem cartões/regras ativos — avisar com as contagens e só então eliminar em cascata
        if (!cascade && err?.status === 409) {
          await this.confirmarCascadeConta(id, err.error);
          return;
        }
        console.error('[FRONTEND] ContasListViewModel.deleteConta - Error:', err);
        this.notification.error('Falha ao eliminar conta');
      }
    });
  }

  private async confirmarCascadeConta(id: string, filhos: { cartoesAtivos: number; regrasAtivas: number }): Promise<void> {
    const mensagem = `Esta conta tem ${filhos.cartoesAtivos} cartão(ões) de crédito pago(s) a partir desta conta e ${filhos.regrasAtivas} regra(s) recorrente(s) ativa(s). ` +
      'Pretende eliminar também todos estes registos?';
    const confirmed = await this.confirmDialog.confirm(mensagem, { variant: 'danger', confirmText: 'Eliminar tudo' });
    if (!confirmed) return;

    this.executarDeleteConta(id, true);
  }
}
