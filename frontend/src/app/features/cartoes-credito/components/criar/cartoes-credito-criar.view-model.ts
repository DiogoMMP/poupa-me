import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { CartoesCreditoService } from '../../services/cartoes-credito.service';
import { NotificationService } from '../../../../services/notification.service';
import { CartoesCreditoInputDTO } from '../../dto/cartoes-credito.dto';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';

/**
 * ViewModel for the Cartões Create component. Handles the logic for submitting creation requests
 * and managing loading state and notifications related to creating credit cards.
 */
@Injectable()
export class CartoesCreditoCriarViewModel {
  private service = inject(CartoesCreditoService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<any[]>([]);

  /**
   * Expose selectedBancoId from the global service so template can check if a banco is selected
   */
  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    // reload accounts whenever selected banco changes
    this.selectedBanco.selectedBancoId$.subscribe(id => {
      this.loadContas(id);
    });
  }

  /**
   * Submits the new card data to the service and handles the response.
   * @param formData - The card data from the form used to create a new credit card.
   */
  submit(formData: CartoesCreditoInputDTO): void {
    this.isLoading$.next(true);

    // Attach the currently selected bancoId if present
    const bancoId = this.selectedBanco.currentBancoId;

    // Require bancoId for creating a cartão
    if (!bancoId) {
      this.isLoading$.next(false);
      this.notification.error('Selecione um banco antes de criar o cartão');
      return;
    }

    // Parse periodo dates from the form (expected HTML date input "yyyy-MM-dd")
    const rawInicio = (formData.periodo as any)?.dataInicio as string | undefined | null;
    const rawFecho = (formData.periodo as any)?.dataFim as string | undefined | null;

    const parseToParts = (raw?: string | null) => {
      if (!raw) return null;
      // Try ISO format first
      const isoMatch = raw.match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
      if (isoMatch) {
        const ano = Number(isoMatch[1]);
        const mes = Number(isoMatch[2]);
        const dia = Number(isoMatch[3]);
        if (Number.isFinite(ano) && Number.isFinite(mes) && Number.isFinite(dia)) return { dia, mes, ano };
      }
      // Fallback: try Date constructor
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
      return null;
    };

    const inicioParts = parseToParts(rawInicio);
    const fechoParts = parseToParts(rawFecho);

    if (!inicioParts || !fechoParts) {
      this.isLoading$.next(false);
      this.notification.error('Datas inválidas. Use o selector de datas para definir o período.');
      return;
    }

    // Build payload with periodo as expected by the API (objects with dia/mes/ano)
    const payload: CartoesCreditoInputDTO = {
      ...formData,
      periodo: {
        inicio: inicioParts,
        fecho: fechoParts
      },
      bancoId
    } as CartoesCreditoInputDTO;

    this.service.create(payload).subscribe({
      next: () => {
        this.notification.success('Cartão criado com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/cartoes-credito']);
      },
      error: (_err) => {
        this.notification.error('Falha ao criar cartão');
        this.isLoading$.next(false);
      }
    });
  }

  private loadContas(bancoId: string | null): void {
    if (!bancoId) {
      this.contas$.next([]);
      return;
    }

    this.contasService.getAll(bancoId).subscribe({
      next: (dtos) => {
        // map DTOs to minimal shape if mapper exists (loads payment accounts for cards)
        try {
          const models = ContasMapper.toModelArray(dtos);
          this.contas$.next(models);
        } catch {
          this.contas$.next(dtos as any[]);
        }
      },
      error: () => {
        this.contas$.next([]);
      }
    });
  }
}
