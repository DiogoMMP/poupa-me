import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { TransacoesService } from '../../services/transacoes.service';
import { TransacoesInputDTO } from '../../dto/transacoes.dto';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { ContasMapper } from '../../../contas/mappers/contas.mapper';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { CategoriasModel } from '../../../categorias/models/categorias.model';

/**
 * ViewModel for the Criar Saídas component.
 * Handles loading state, accounts, categories and submission of a Saída transaction.
 */
@Injectable()
export class TransacoesCriarSaidasViewModel {
  private service = inject(TransacoesService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);
  private categoriasService = inject(CategoriasService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<any[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasModel[]>([]);

  /**
   * Expose selectedBancoId from the global service so template can check if a banco is selected
   */
  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    // reload accounts whenever selected banco changes
    this.selectedBanco.selectedBancoId$.subscribe(id => this.loadContas(id));
    this.loadCategorias();
  }

  /**
   * Submits a new Saída transaction.
   * Expects formData with: { data: string (ISO date), descricao, valor: { valor, moeda }, categoriaId, contaId }
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
      contaId: formData.contaId || undefined,
    };

    this.service.createSaida(payload).subscribe({
      next: () => {
        this.notification.success('Saída criada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/transacoes']);
      },
      error: () => {
        this.notification.error('Falha ao criar saída');
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

  private loadCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (dtos) => this.categorias$.next(dtos as CategoriasModel[]),
      error: () => this.categorias$.next([])
    });
  }
}
