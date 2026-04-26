import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DespesasRecorrentesService } from '../../services/despesas-recorrentes.service';
import { NotificationService } from '../../../../services/notification.service';
import { DespesasRecorrentesMapper } from '../../mappers/despesas-recorrentes.mapper';
import { DespesaRecorrenteModel, TipoDespesaRecorrente } from '../../models/despesas-recorrentes.model';
import { SelectedBancoService } from '../../../../services/selected-banco.service';

/**
 * ViewModel for the despesas recorrentes list component.
 */
@Injectable()
export class DespesasRecorrentesListarRegrasViewModel {
  private service = inject(DespesasRecorrentesService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly regras$ = new BehaviorSubject<DespesaRecorrenteModel[]>([]);

  constructor() {
    // Reload when selected bank changes
    this.selectedBanco.selectedBancoId$.subscribe(() => this.loadData());
  }

  get bancoId(): string | null {
    return this.selectedBanco.currentBancoId;
  }

  formatAgendamento(regra: DespesaRecorrenteModel): string {
    switch (regra.tipo) {
      case 'Despesa Semanal':
        return this.formatSemanal(regra.diaDaSemana);
      case 'Despesa Mensal':
        return regra.diaDoMes != null ? `Todo dia ${regra.diaDoMes}` : 'Sem dia definido';
      case 'Despesa Anual':
        return regra.diaDoMes != null && regra.mes != null
          ? `Todo dia ${regra.diaDoMes} de ${this.getMesLabel(regra.mes)}`
          : 'Sem dia definido';
      case 'Poupança':
        return regra.diaDoMes != null ? `Todo dia ${regra.diaDoMes}` : 'Sem dia definido';
      default:
        return 'Sem dia definido';
    }
  }

  getTipoClass(tipo: TipoDespesaRecorrente | string): string {
    switch (tipo) {
      case 'Despesa Semanal':
        return 'badge--semanal';
      case 'Despesa Mensal':
        return 'badge--mensal';
      case 'Despesa Anual':
        return 'badge--anual';
      case 'Poupança':
        return 'badge--poupanca';
      default:
        return '';
    }
  }

  /**
   * Loads the list of despesas recorrentes regras. This method is called when the component initializes and can be
   * called again to refresh the data.
   */
  loadData(): void {
    this.isLoading$.next(true);
    const bancoId = this.bancoId ?? undefined;
    this.service.getAll(bancoId).subscribe({
      next: (dtos) => {
        this.regras$.next(DespesasRecorrentesMapper.toModelArray(dtos));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Falha ao carregar regras');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes uma despesa recorrente regra by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the despesa recorrente regra to delete
   */
  deleteRegra(id: string): void {
    if (!id) return;
    if (!confirm('Tem a certeza que pretende eliminar esta regra?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Regra eliminada');
        this.loadData();
      },
      error: () => this.notification.error('Falha ao eliminar regra')
    });
  }

  private formatSemanal(diaDaSemana?: number): string {
    if (diaDaSemana == null) return 'Sem dia definido';

    const labels: Record<number, string> = {
      1: 'segundas-feiras',
      2: 'terças-feiras',
      3: 'quartas-feiras',
      4: 'quintas-feiras',
      5: 'sextas-feiras',
      6: 'sábados',
      7: 'domingos'
    };

    const label = labels[diaDaSemana];
    if (!label) return 'Sem dia definido';

    return diaDaSemana >= 6 ? `Todos os ${label}` : `Todas as ${label}`;
  }

  private getMesLabel(mes: number): string {
    const labels: Record<number, string> = {
      1: 'janeiro',
      2: 'fevereiro',
      3: 'março',
      4: 'abril',
      5: 'maio',
      6: 'junho',
      7: 'julho',
      8: 'agosto',
      9: 'setembro',
      10: 'outubro',
      11: 'novembro',
      12: 'dezembro'
    };

    return labels[mes] ?? String(mes);
  }
}
