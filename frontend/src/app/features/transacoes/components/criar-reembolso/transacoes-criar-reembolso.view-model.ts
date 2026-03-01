import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { TransacoesService } from '../../services/transacoes.service';
import { TransacoesInputDTO } from '../../dto/transacoes.dto';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { CategoriasModel } from '../../../categorias/models/categorias.model';
import { CartoesCreditoService } from '../../../cartoes-credito/services/cartoes-credito.service';

/**
 * ViewModel for the Criar Reembolso component.
 * Handles loading state, credit-cards, categories and submission of a Reembolso transaction.
 */
@Injectable()
export class TransacoesCriarReembolsoViewModel {
  private service = inject(TransacoesService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private categoriasService = inject(CategoriasService);
  private cartoesService = inject(CartoesCreditoService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly categorias$ = new BehaviorSubject<CategoriasModel[]>([]);
  readonly cartoes$ = new BehaviorSubject<any[]>([]);

  /**
   * Expose selectedBancoId from the global service so template can check if a banco is selected
   */
  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    // reload accounts/cards whenever selected banco changes
    this.selectedBanco.selectedBancoId$.subscribe(id => {
      this.loadCartoes(id);
    });
    this.loadCategorias();
  }

  /**
   * Submits a new Reembolso transaction.
   * Expects formData with: { data: string (ISO date), descricao, valor: { valor, moeda }, categoriaId, cartaoCreditoId }
   */
  submit(formData: any): void {
    this.isLoading$.next(true);

    const rawDate: string = formData.data ?? '';
    const isoMatch = rawDate.match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
    let dateParts: { dia: number; mes: number; ano: number } | null = null;

    if (isoMatch) {
      dateParts = { ano: +isoMatch[1], mes: +isoMatch[2], dia: +isoMatch[3] };
    } else {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateParts = { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
      }
    }

    if (!dateParts) {
      this.isLoading$.next(false);
      this.notification.error('Data inválida. Use o selector de data.');
      return;
    }

    const payload: TransacoesInputDTO = {
      data: dateParts,
      descricao: formData.descricao,
      valor: { valor: +formData.valor.valor, moeda: formData.valor.moeda },
      categoriaId: formData.categoriaId,
      cartaoCreditoId: formData.cartaoCreditoId || undefined,
    } as any;

    this.service.createReembolso(payload).subscribe({
      next: () => {
        this.notification.success('Reembolso criado com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/transacoes']);
      },
      error: () => {
        this.notification.error('Falha ao criar reembolso');
        this.isLoading$.next(false);
      }
    });
  }

  private loadCartoes(bancoId: string | null): void {
    if (!bancoId) { this.cartoes$.next([]); return; }
    this.cartoesService.getAll(bancoId).subscribe({
      next: (dtos) => this.cartoes$.next(dtos as any[]),
      error: () => this.cartoes$.next([])
    });
  }

  private loadCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (dtos) => this.categorias$.next(dtos as CategoriasModel[]),
      error: () => this.categorias$.next([])
    });
  }
}
