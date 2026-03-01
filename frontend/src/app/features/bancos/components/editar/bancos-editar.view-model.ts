import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { BancosService } from '../../services/bancos.service';
import { NotificationService } from '../../../../services/notification.service';
import { BancosModel } from '../../models/bancos.model';
import { BancosMapper } from '../../mappers/bancos.mapper';
import {BancosUpdateDTO} from '../../dto/bancos.dto';
import { ContasService } from '../../../contas/services/contas.service';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';
import { ContasModel } from '../../../contas/models/contas.model';
import { CartoesCreditoService } from '../../../cartoes-credito/services/cartoes-credito.service';
import { CartoesCreditoMapper } from '../../../cartoes-credito/mappers/cartoes-credito.mapper';
import { CartoesCreditoModel } from '../../../cartoes-credito/models/cartoes-credito.model';

/**
 * ViewModel for the Bancos Editar component. Handles the logic for loading bank data and submitting updates.
 */
@Injectable()
export class BancosEditarViewModel {
  private service = inject(BancosService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private contasService = inject(ContasService);
  private cartoesService = inject(CartoesCreditoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly banco$ = new BehaviorSubject<BancosModel | null>(null);
  readonly contas$ = new BehaviorSubject<ContasModel[]>([]);
  readonly cartoes$ = new BehaviorSubject<CartoesCreditoModel[]>([]);

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
        // load contas and cartoes for this banco so the editor can show selection lists
        this.loadContas(id);
        this.loadCartoes(id);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar banco');
        this.isLoading$.next(false);
        this.router.navigate(['/bancos']);
      }
    });
  }

  private loadContas(bancoId: string): void {
    this.contasService.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = ContasMapper.toModelArray(dtos);
        this.contas$.next(models);
      },
      error: () => {
        this.contas$.next([]);
      }
    });
  }

  private loadCartoes(bancoId: string): void {
    this.cartoesService.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = CartoesCreditoMapper.toModelArray(dtos);
        this.cartoes$.next(models);
      },
      error: () => {
        this.cartoes$.next([]);
      }
    });
  }

  /**
   * Submits the updated bank data to the service and handles the response.
   * @param id - The ID of the bank being updated.
   * @param formData - The updated bank data from the form.
   */
  submit(id: string, formData: BancosUpdateDTO): void {
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
