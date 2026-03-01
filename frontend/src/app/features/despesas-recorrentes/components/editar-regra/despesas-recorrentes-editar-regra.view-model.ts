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
import { DespesaRecorrenteDTO, UpdateDespesaRecorrenteDTO } from '../../dto/despesas-recorrentes.dto';

@Injectable()
export class DespesasRecorrentesEditarRegraViewModel {
  private service = inject(DespesasRecorrentesService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private selectedBanco = inject(SelectedBancoService);
  private contasService = inject(ContasService);
  private categoriasService = inject(CategoriasService);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly contas$ = new BehaviorSubject<ContasDto[]>([]);
  readonly categorias$ = new BehaviorSubject<CategoriasDTO[]>([]);
  readonly regra$ = new BehaviorSubject<DespesaRecorrenteDTO | null>(null);

  get selectedBancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  constructor() {
    this.selectedBanco.selectedBancoId$.subscribe(id => this.loadContas(id));
    this.loadCategorias();
  }

  load(id: string): void {
    this.isLoading$.next(true);
    this.service.getById(id).subscribe({
      next: dto => {
        this.regra$.next(dto);
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar regra');
        this.isLoading$.next(false);
      }
    });
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

  update(id: string, dto: UpdateDespesaRecorrenteDTO): void {
    this.isLoading$.next(true);
    this.service.update(id, dto).subscribe({
      next: () => {
        this.notification.success('Regra atualizada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/despesas-recorrentes/listar-regras']);
      },
      error: () => {
        this.notification.error('Falha ao atualizar regra');
        this.isLoading$.next(false);
      }
    });
  }
}
