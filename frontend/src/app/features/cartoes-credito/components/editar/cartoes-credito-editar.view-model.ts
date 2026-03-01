import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { CartoesCreditoService } from '../../services/cartoes-credito.service';
import { NotificationService } from '../../../../services/notification.service';
import { CartoesCreditoModel } from '../../models/cartoes-credito.model';
import { CartoesCreditoMapper } from '../../mappers/cartoes-credito.mapper';
import { CartoesCreditoUpdateDTO} from '../../dto/cartoes-credito.dto';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';

/**
 * ViewModel for the Cartões Edit component. Handles the logic for loading card data and submitting updates.
 */
@Injectable()
export class CartoesCreditoEditarViewModel {
  private service = inject(CartoesCreditoService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly cartao$ = new BehaviorSubject<CartoesCreditoModel | null>(null);
  readonly contas$ = new BehaviorSubject<any[]>([]);

  constructor() {
    // reload contas whenever banco selection changes so select options are correct
    this.selectedBanco.selectedBancoId$.subscribe(id => {
      this.loadContas(id);
    });
  }

  private loadContas(bancoId: string | null): void {
    if (!bancoId) {
      this.contas$.next([]);
      return;
    }
    this.contasService.getAll(bancoId).subscribe({
      next: (dtos) => {
        try {
          const models = ContasMapper.toModelArray(dtos);
          this.contas$.next(models);
        } catch {
          this.contas$.next(dtos as any[]);
        }
      },
      error: () => this.contas$.next([])
    });
  }

  /**
   * Loads the card data by ID and updates the state accordingly.
   * @param id
   */
  loadData(id: string): void {
    this.isLoading$.next(true);

    this.service.getById(id).subscribe({
      next: (dto) => {
        const model = CartoesCreditoMapper.toModel(dto);
        this.cartao$.next(model);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar cartão');
        this.isLoading$.next(false);
        this.router.navigate(['/cartoes-credito']);
      }
    });
  }

  /**
   * Submits the updated card data to the service and handles the response.
   * Accepts partial update DTO; note that `saldoUtilizado` is intentionally excluded from updates.
   * @param id - The ID of the card being updated.
   * @param formData - The updated card data from the form.
   */
  submit(id: string, formData: CartoesCreditoUpdateDTO): void {
    this.isLoading$.next(true);

    // Helper to parse date strings (yyyy-MM-dd or other parseable formats) into {dia, mes, ano}
    const parseToParts = (raw?: string | null) => {
      if (!raw) return null;
      const isoMatch = String(raw).match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
      if (isoMatch) {
        const ano = Number(isoMatch[1]);
        const mes = Number(isoMatch[2]);
        const dia = Number(isoMatch[3]);
        if (Number.isFinite(ano) && Number.isFinite(mes) && Number.isFinite(dia)) return { dia, mes, ano };
      }
      const d = new Date(String(raw));
      if (!isNaN(d.getTime())) return { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
      return null;
    };

    // If periodo is included in the update payload, normalize its date fields
    if ((formData as any)?.periodo) {
      const rawInicio = (formData as any).periodo?.dataInicio;
      const rawFecho = (formData as any).periodo?.dataFim;
      const inicioParts = parseToParts(rawInicio);
      const fechoParts = parseToParts(rawFecho);
      if (!inicioParts || !fechoParts) {
        this.isLoading$.next(false);
        this.notification.error('Datas inválidas. Use o selector de datas para definir o período.');
        return;
      }
      (formData as any).periodo = { inicio: inicioParts, fecho: fechoParts };
    }

    this.service.update(id, formData).subscribe({
      next: () => {
        this.notification.success('Cartão atualizado com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/cartoes-credito']);
      },
      error: (_err) => {
        this.notification.error('Falha ao atualizar cartão');
        this.isLoading$.next(false);
      }
    });
  }
}
