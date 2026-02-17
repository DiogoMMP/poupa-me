import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { BancosService } from '../../services/bancos.service';
import { NotificationService } from '../../../../services/notification.service';
import {BancosInputDTO} from '../../dto/bancos.dto';

/**
 * ViewModel for the Bancos Create component. Handles the logic for submitting creation requests
 * and managing loading state and notifications.
 */
@Injectable()
export class BancosCriarViewModel {
  private service = inject(BancosService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  /**
   * Submits the new bank data to the service and handles the response.
   * @param formData - The bank data from the form used to create a new bank.
   */
  submit(formData: BancosInputDTO): void {
    this.isLoading$.next(true);

    this.service.create(formData).subscribe({
      next: () => {
        this.notification.success('Banco criado com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/bancos']);
      },
      error: (_err) => {
        this.notification.error('Falha ao criar banco');
        this.isLoading$.next(false);
      }
    });
  }
}
