import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { BancosService } from '../../services/bancos.service';
import { NotificationService } from '../../../../services/notification.service';
import { BancosModel } from '../../models/bancos.model';
import { BancosMapper } from '../../mappers/bancos.mapper';

/**
 * ViewModel for the Bancos Editar component. Handles the logic for loading bank data and submitting updates.
 */
@Injectable()
export class BancosEditarViewModel {
  private service = inject(BancosService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly banco$ = new BehaviorSubject<BancosModel | null>(null);

  /**
   * Loads the bank data by ID and updates the state accordingly.
   * @param id
   */
  loadData(id: string): void {
    this.isLoading$.next(true);

    this.service.getById(id).subscribe({
      next: (dto) => {
        const model = BancosMapper.toModel(dto);
        this.banco$.next(model);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar banco');
        this.isLoading$.next(false);
        this.router.navigate(['/bancos']);
      }
    });
  }

  /**
   * Submits the updated bank data to the service and handles the response.
   * @param id - The ID of the bank being updated.
   * @param formData - The updated bank data from the form.
   */
  submit(id: string, formData: { nome: string; icon: string }): void {
    this.isLoading$.next(true);

    this.service.update(id, formData).subscribe({
      next: () => {
        this.notification.success('Banco atualizado com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/bancos']);
      },
      error: (_err) => {
        this.notification.error('Falha ao atualizar banco');
        this.isLoading$.next(false);
      }
    });
  }
}
