import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { TransacoesService } from '../../services/transacoes.service';
import { TransacoesUpdateDTO, TransacoesDTO } from '../../dto/transacoes.dto';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { CategoriasModel } from '../../../categorias/models/categorias.model';
import { CartoesCreditoService } from '../../../cartoes-credito/services/cartoes-credito.service';
import { CartoesCreditoMapper } from '../../../cartoes-credito/mappers/cartoes-credito.mapper';

/**
 * ViewModel for the Edit Transacao component.
 * Loads a transaction by id and performs updates.
 */
@Injectable()
export class TransacoesEditarViewModel {
  private service = inject(TransacoesService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);
  private categoriasService = inject(CategoriasService);
  private cartoesService = inject(CartoesCreditoService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<any[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasModel[]>([]);
  readonly cartoes$ = new BehaviorSubject<any[]>([]);
  readonly transacao$ = new BehaviorSubject<TransacoesDTO | null>(null);

  private currentId: string | null = null;

  /**
   * Expose selectedBancoId from the global service so template can check if a banco is selected
   */
  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    // reload accounts and cards whenever selected banco changes
    this.selectedBanco.selectedBancoId$.subscribe(id => {
      this.loadContas(id);
      this.loadCartoes(id);
    });
    this.loadCategorias();
  }

  /**
   * Loads a transaction by id.
   * @param id Transaction id
   */
  load(id: string): void {
    if (!id) return;
    this.currentId = id;
    this.isLoading$.next(true);
    this.service.getById(id).subscribe({
      next: (dto) => {
        this.transacao$.next(dto);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[TransacoesEditarViewModel] load error', err);
        this.notification.error('Falha ao carregar transação');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Submits an update for the transaction.
   * Expects formData with: { data: string (ISO date), descricao, valor: { valor, moeda }, categoriaId, contaId }
   */
  update(formData: any): void {
    if (!this.currentId) {
      this.notification.error('ID da transação em falta');
      return;
    }
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

    const payload: TransacoesUpdateDTO = {
      data: dateParts,
      descricao: formData.descricao,
      valor: { valor: +formData.valor.valor, moeda: formData.valor.moeda },
      categoriaId: formData.categoriaId,
      contaId: formData.contaId || undefined,
      cartaoCreditoId: formData.cartaoCreditoId || undefined,
      status: formData.status || undefined
    };

    this.service.update(this.currentId, payload).subscribe({
      next: () => {
        this.notification.success('Transação atualizada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/transacoes']);
      },
      error: (err) => {
        console.error('[TransacoesEditarViewModel] update error', err);
        this.notification.error('Falha ao atualizar transação');
        this.isLoading$.next(false);
      }
    });
  }

  private loadContas(bancoId: string | null): void {
    if (!bancoId) { this.contas$.next([]); return; }
    this.contasService.getAll(bancoId).subscribe({
      next: (dtos) => {
        try { this.contas$.next(ContasMapper.toModelArray(dtos)); }
        catch { this.contas$.next(dtos as any[]); }
      },
      error: () => this.contas$.next([])
    });
  }

  private loadCartoes(bancoId: string | null): void {
    if (!bancoId) { this.cartoes$.next([]); return; }
    this.cartoesService.getAll(bancoId).subscribe({
      next: (dtos) => this.cartoes$.next(CartoesCreditoMapper.toModelArray(dtos)),
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
