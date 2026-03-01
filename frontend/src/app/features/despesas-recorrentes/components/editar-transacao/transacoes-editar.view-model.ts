import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/notification.service';
import { TransacoesService } from '../../../transacoes/services/transacoes.service';
import { TransacoesDTO, TransacoesUpdateDTO } from '../../../transacoes/dto/transacoes.dto';

@Injectable()
export class DespesasRecorrentesEditarTransacaoViewModel {
  private service = inject(TransacoesService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly transacao$ = new BehaviorSubject<TransacoesDTO | null>(null);

  private currentId: string | null = null;

  load(id: string): void {
    if (!id) return;
    this.currentId = id;
    this.isLoading$.next(true);
    this.service.getById(id).subscribe({
      next: dto => {
        this.transacao$.next(dto);
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar transação');
        this.isLoading$.next(false);
      }
    });
  }

  update(data: { dia: number; mes: number; ano: number }, valor: { valor: number; moeda: string }): void {
    if (!this.currentId) {
      this.notification.error('ID da transação em falta');
      return;
    }
    this.isLoading$.next(true);

    const payload: TransacoesUpdateDTO = { data, valor };

    this.service.update(this.currentId, payload).subscribe({
      next: () => {
        this.notification.success('Transação atualizada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/despesas-recorrentes']);
      },
      error: () => {
        this.notification.error('Falha ao atualizar transação');
        this.isLoading$.next(false);
      }
    });
  }
}
