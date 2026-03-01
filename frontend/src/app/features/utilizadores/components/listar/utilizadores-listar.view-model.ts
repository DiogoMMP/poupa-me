import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UtilizadoresService } from '../../services/utilizadores.service';
import { NotificationService } from '../../../../services/notification.service';
import { UtilizadoresModel } from '../../models/utilizadores.model';
import { UtilizadoresMapper } from '../../mappers/utilizadores.mapper';
import { AuthService } from '../../../auth/services/auth.service';

/**
 * ViewModel for the users list component.
 */
@Injectable()
export class UtilizadoresListViewModel {
  private service = inject(UtilizadoresService);
  private notification = inject(NotificationService);
  public auth = inject(AuthService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly users$ = new BehaviorSubject<UtilizadoresModel[]>([]);

  /**
   * Loads the list of utilizadores. This method is called when the component initializes and can be
   * called again to refresh the data.
   */
  loadData(): void {
    this.isLoading$.next(true);
    this.service.getAll().subscribe({
      next: (dtos) => {
        this.users$.next(UtilizadoresMapper.toModelArray(dtos));
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[FRONTEND] UtilizadoresListViewModel.loadData -', err);
        this.notification.error('Falha ao carregar utilizadores');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes a utilizador by email after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param email The email of the utilizador to delete
   */
  deleteUserByEmail(email: string): void {
    if (!email) return;
    if (!confirm('Tem a certeza que pretende eliminar este utilizador?')) return;

    this.service.deleteByEmail(email).subscribe({
      next: () => {
        this.notification.success('Utilizador eliminado');
        this.loadData();
      },
      error: () => this.notification.error('Falha ao eliminar utilizador')
    });
  }

  toggleRole(email: string, currentRole: string): void {
    if (!email) return;
    const newRole = currentRole?.toLowerCase() === 'admin' ? 'User' : 'Admin';
    this.service.toggleRole(email, { role: newRole }).subscribe({
      next: () => {
        this.notification.success(`Role alterada para ${newRole}`);
        this.loadData();
      },
      error: () => this.notification.error('Falha ao alterar role')
    });
  }
}
