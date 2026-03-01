import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ContasService } from '../../services/contas.service';
import { NotificationService } from '../../../../services/notification.service';
import { ContasModel } from '../../models/contas.model';
import { ContasMapper } from '../../mappers/contas.mapper';
import { ContasUpdateDTO} from '../../dto/contas.dto';

/**
 * ViewModel for the Contas Editar component. Handles the logic for loading account data and submitting updates.
 */
@Injectable()
export class ContasEditarViewModel {
  private service = inject(ContasService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly conta$ = new BehaviorSubject<ContasModel | null>(null);

  /**
   * Loads the account data by ID and updates the state accordingly.
   * @param id
   */
  loadData(id: string): void {
    this.isLoading$.next(true);

    this.service.getById(id).subscribe({
      next: (dto) => {
        const model = ContasMapper.toModel(dto);
        this.conta$.next(model);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar conta');
        this.isLoading$.next(false);
        this.router.navigate(['/contas']);
      }
    });
  }

  /**
   * Submits the updated account data to the service and handles the response.
   * @param id - The ID of the account being updated.
   * @param formData - The updated account data from the form.
   */
  submit(id: string, formData: ContasUpdateDTO): void {
    this.isLoading$.next(true);

    this.service.update(id, formData).subscribe({
      next: () => {
        this.notification.success('Conta atualizada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/contas']);
      },
      error: (_err) => {
        this.notification.error('Falha ao atualizar conta');
        this.isLoading$.next(false);
      }
    });
  }
}
