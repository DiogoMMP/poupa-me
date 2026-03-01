import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { DespesasRecorrentesService } from '../../services/despesas-recorrentes.service';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { CategoriasService } from '../../../categorias/services/categorias.service';
import { ContasDto } from '../../../contas/dto/contas.dto';
import { CategoriasDTO } from '../../../categorias/dto/categorias.dto';
import { CreateDespesaRecorrenteDTO } from '../../dto/despesas-recorrentes.dto';

@Injectable()
export class DespesasRecorrentesNovaRegraViewModel {
  private service = inject(DespesasRecorrentesService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);
  private categoriasService = inject(CategoriasService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<ContasDto[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasDTO[]>([]);

  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    this.selectedBanco.selectedBancoId$.subscribe(id => {
      this.loadContas(id);
    });
    this.loadCategorias();
  }

  private loadContas(bancoId: string | null): void {
    this.contasService.getAll(bancoId ?? undefined).subscribe({
      next: contas => this.contas$.next(contas),
      error: () => this.notification.error('Falha ao carregar contas')
    });
  }

  private loadCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: cats => this.categorias$.next(cats),
      error: () => this.notification.error('Falha ao carregar categorias')
    });
  }

  submit(formData: CreateDespesaRecorrenteDTO): void {
    if (!this.selectedBancoId) {
      this.notification.error('Selecione um banco antes de criar a regra');
      return;
    }
    this.isLoading$.next(true);
    this.service.create(formData).subscribe({
      next: () => {
        this.notification.success('Regra criada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/despesas-recorrentes']);
      },
      error: () => {
        this.notification.error('Falha ao criar regra');
        this.isLoading$.next(false);
      }
    });
  }
}

