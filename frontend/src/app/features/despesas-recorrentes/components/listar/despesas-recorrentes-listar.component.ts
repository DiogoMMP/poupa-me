import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DespesasRecorrentesListViewModel, DespesaFilters } from './despesas-recorrentes-listar.view-model';
import { TransacaoModel } from '../../../transacoes/models/transacoes.model';
import { DespesaRecorrenteModel } from '../../models/despesas-recorrentes.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-despesas-recorrentes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './despesas-recorrentes-listar.component.html',
  styleUrls: ['./despesas-recorrentes-listar.component.css'],
  providers: [DespesasRecorrentesListViewModel]
})
export class DespesasRecorrentesListComponent implements OnInit {
  public vm = inject(DespesasRecorrentesListViewModel);
  private router = inject(Router);

  // Filter form state
  pendenteFilterForm: DespesaFilters = { categoriaId: '', period: 'Este Mês' };
  concluidaFilterForm: DespesaFilters = { categoriaId: '', period: 'Este Mês' };

  // Toggle filter panels
  showPendenteFilters = false;
  showConcluidaFilters = false;

  // Pagination
  pendentePage = 1;
  concluidaPage = 1;

  ngOnInit(): void {
    this.vm.loadAll();
  }


  /**
   * User clicked a recurring expense without valor — navigate to gerar-transacao form
   */
  onDespesaSemValorClick(d: DespesaRecorrenteModel): void {
    this.router.navigate(['/despesas-recorrentes/gerar-transacao', d.id]);
  }

  paginate(items: TransacaoModel[], page: number): TransacaoModel[] {
    return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  totalPages(items: TransacaoModel[]): number {
    return Math.ceil(items.length / PAGE_SIZE) || 1;
  }

  // ── Pendente filters ──────────────────────────────────────

  applyPendenteFilters(): void {
    this.pendentePage = 1;
    this.vm.applyPendenteFilters({ ...this.pendenteFilterForm });
  }

  clearPendenteFilters(): void {
    this.pendentePage = 1;
    this.pendenteFilterForm = { categoriaId: '', period: 'Este Mês' };
    this.vm.clearPendenteFilters();
  }

  hasActivePendenteFilters(): boolean {
    return !!(this.pendenteFilterForm.categoriaId || this.pendenteFilterForm.period);
  }

  // ── Concluída filters ─────────────────────────────────────

  applyConcluidaFilters(): void {
    this.concluidaPage = 1;
    this.vm.applyConcluidaFilters({ ...this.concluidaFilterForm });
  }

  clearConcluidaFilters(): void {
    this.concluidaPage = 1;
    this.concluidaFilterForm = { categoriaId: '', period: 'Este Mês' };
    this.vm.clearConcluidaFilters();
  }

  hasActiveConcluidaFilters(): boolean {
    return !!(this.concluidaFilterForm.categoriaId || this.concluidaFilterForm.period);
  }
}
