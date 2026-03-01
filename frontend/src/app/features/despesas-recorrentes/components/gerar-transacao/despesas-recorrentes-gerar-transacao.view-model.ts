import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/notification.service';
import { DespesasRecorrentesService } from '../../services/despesas-recorrentes.service';
import { DespesasRecorrentesMapper } from '../../mappers/despesas-recorrentes.mapper';
import { DespesaRecorrenteModel } from '../../models/despesas-recorrentes.model';
import { GerarTransacaoSemValorDTO } from '../../dto/despesas-recorrentes.dto';

/**
 * ViewModel for the Bancos Create component. Handles the logic for submitting creation requests
 * and managing loading state and notifications.
 */
@Injectable()
export class DespesasRecorrentesGerarTransacaoViewModel {
  private service = inject(DespesasRecorrentesService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly despesa$ = new BehaviorSubject<DespesaRecorrenteModel | null>(null);

  /**
   * Loads a despesa recorrente by id.
   * @param id - The id of the despesa recorrente to load.
   */
  loadById(id: string): void {
    this.isLoading$.next(true);
    this.service.getById(id).subscribe({
      next: dto => {
        this.despesa$.next(DespesasRecorrentesMapper.toModel(dto));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar despesa recorrente');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Submits the request to gerar transacao for a despesa recorrente.
   * @param id - The id of the despesa recorrente.
   * @param dto - The data transfer object containing the details for gerar transacao.
   */
  submit(id: string, dto: GerarTransacaoSemValorDTO): void {
    this.isLoading$.next(true);
    this.service.gerarTransacao(id, dto).subscribe({
      next: () => {
        this.notification.success('Transação gerada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/despesas-recorrentes']);
      },
      error: () => {
        this.notification.error('Falha ao gerar transação');
        this.isLoading$.next(false);
      }
    });
  }
}
