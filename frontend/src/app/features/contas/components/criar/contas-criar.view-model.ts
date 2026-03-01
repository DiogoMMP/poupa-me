import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ContasService } from '../../services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { ContasInputDTO } from '../../dto/contas.dto';
import { SelectedBancoService } from '../../../../services/selected-banco.service';

/**
 * ViewModel for the Bancos Create component. Handles the logic for submitting creation requests
 * and managing loading state and notifications.
 */
@Injectable()
export class ContasCriarViewModel {
  private service = inject(ContasService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  /**
   * Expose selectedBancoId from the global service so template can check if a banco is selected
   */
  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  /**
   * Submits the new account data to the service and handles the response.
   * @param formData - The account data from the form used to create a new account.
   */
  submit(formData: ContasInputDTO): void {
    this.isLoading$.next(true);

    // Attach the currently selected bancoId if present
    const bancoId = this.selectedBanco.currentBancoId;

    // Require bancoId for creating a conta
    if (!bancoId) {
      this.isLoading$.next(false);
      this.notification.error('Selecione um banco antes de criar a conta');
      return;
    }

    const payload = { ...formData, bancoId };

    this.service.create(payload).subscribe({
      next: () => {
        this.notification.success('Conta criada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/contas']);
      },
      error: (_err) => {
        this.notification.error('Falha ao criar conta');
        this.isLoading$.next(false);
      }
    });
  }
}
