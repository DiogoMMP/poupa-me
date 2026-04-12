import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, catchError, of, switchMap, combineLatest, debounceTime, tap } from 'rxjs';
import { BancosService } from '../../bancos/services/bancos.service';
import { BancosMapper } from '../../bancos/mappers/bancos.mapper';
import { NotificationService } from '../../../services/notification.service';
import { SelectedBancoService } from '../../../services/selected-banco.service';
import { EstatisticasService } from '../services/estatisticas.service';
import { EstatisticasModel } from '../models/estatisticas.model';
import { EstatisticasMapper } from '../mappers/estatisticas.mapper';
import { BancosModel } from '../../bancos/models/bancos.model';

@Injectable()
export class EstatisticasViewModel {
  private estatisticasService = inject(EstatisticasService);
  private bancosService = inject(BancosService);
  private notification = inject(NotificationService);
  private selectedBancoService = inject(SelectedBancoService);

  readonly estatisticas$ = new BehaviorSubject<EstatisticasModel | null>(null);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly bancos$ = new BehaviorSubject<BancosModel[]>([]);

  readonly selectedMonth$ = new BehaviorSubject<number | null>(null);
  readonly selectedYear$ = new BehaviorSubject<number | null>(null);

  readonly hasBancoSelected$ = this.selectedBancoService.selectedBancoId$.pipe(
    map(id => !!id)
  );

  private selectedBancoId: string | null = null;

  constructor() {
    combineLatest([
      this.selectedBancoService.selectedBancoId$,
      this.selectedMonth$,
      this.selectedYear$
    ]).pipe(
      debounceTime(100)
    ).subscribe(([bancoId, month, year]) => {
      this.loadEstatisticas(bancoId, month, year);
    });
  }

  loadBancos(): void {
    this.bancosService.getAll().subscribe({
      next: (dtos) => {
        const models = BancosMapper.toModelArray(dtos);
        this.bancos$.next(models);

        const storedId = this.selectedBancoService.currentBancoId;
        if (storedId && !models.some(b => b.id === storedId)) {
          this.selectedBancoService.clearSelection();
        }
      },
      error: (err: any) => {
        if (err?.status !== 401) {
          console.error('[FRONTEND] EstatisticasViewModel.loadBancos -', err);
          this.notification.error('Falha ao carregar bancos');
        }
        this.bancos$.next([]);
      }
    });
  }

  setMonthYear(month: number | null, year: number | null): void {
    this.selectedMonth$.next(month);
    this.selectedYear$.next(year);
  }

  private loadEstatisticas(bancoId: string | null, month: number | null, year: number | null): void {
    if (!bancoId) {
      this.estatisticas$.next(null);
      return;
    }

    this.isLoading$.next(true);
    this.estatisticasService.getEstatisticas(bancoId, month ?? undefined, year ?? undefined).subscribe({
      next: (dto) => {
        const model = EstatisticasMapper.toModel(dto);
        this.estatisticas$.next(model);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[FRONTEND] EstatisticasViewModel.loadEstatisticas -', err);
        this.notification.error('Falha ao carregar estatísticas');
        this.isLoading$.next(false);
      }
    });
  }
}
