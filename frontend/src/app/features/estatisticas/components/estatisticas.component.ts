import {Component, ChangeDetectionStrategy, inject, OnInit, HostListener} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AuthService} from '../../auth/services/auth.service';
import { signal } from '@angular/core';
import { EstatisticasViewModel } from './estatisticas.view-model';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { map } from 'rxjs/operators';

/**
 * Estatisticas component.
 */
@Component({
  selector: 'app-estatisticas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, NgxChartsModule],
  templateUrl: 'estatisticas.component.html',
  styleUrls: ['estatisticas.component.css'],
  host: {class: 'page-estatisticas'},
  standalone: true,
  providers: [EstatisticasViewModel, CurrencyPipe]
})

/**
 * Estatísticas component class.
 */
export class EstatisticasComponent implements OnInit {
  private auth = inject(AuthService);
  user = this.auth.user;

  msg = signal('');

  // ViewModel
  vm = inject(EstatisticasViewModel);

  estatisticas$ = this.vm.estatisticas$;
  isLoading$ = this.vm.isLoading$;
  hasBancoSelected$ = this.vm.hasBancoSelected$;

  // Chart data
  pieChartData$ = this.estatisticas$.pipe(
    map(stats => stats?.categorias.map(c => ({ name: c.categoria.nome, value: c.total.valor })))
  );

  lineChartData$ = this.estatisticas$.pipe(
    map(stats => stats ? [{
      name: 'Despesas',
      series: stats.historicoDiario.map(h => ({
        name: `${h.data.dia}/${h.data.mes}`,
        value: h.total.valor
      }))
    }] : [])
  );

  selectedMonth: number | '' = '';
  selectedYear: number | '' = '';

  showFilters = false;

  months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  years: number[] = [];


  ngOnInit(): void {
    this.msg.set(this.computeMsg());
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.years.push(i);
    }

    // Set initial filters (empty by default)
    this.vm.setMonthYear(null, null);

    this.vm.loadBancos();
  }

  hasActiveFilters(): boolean {
    return this.selectedMonth !== '' || this.selectedYear !== '';
  }

  applyFilters(): void {
    const month = this.selectedMonth === '' ? null : Number(this.selectedMonth);
    const year = this.selectedYear === '' ? null : Number(this.selectedYear);

    this.vm.setMonthYear(month, year);
    this.showFilters = false;
  }

  clearFilters(): void {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.vm.setMonthYear(null, null);
    this.showFilters = false;
  }

  mensagensEstatisticas = [
    "O segredo não é ganhar mais, é gerir melhor o que já tem na mão.",
    "Cada euro provisionado para o seu cartão é uma dor de cabeça a menos no final do mês.",
    "O seu cashflow é o batimento cardíaco das suas finanças: mantenha-o estável e saudável.",
    "Saber exatamente para onde vai o seu dinheiro é o primeiro passo para decidir onde ele deve estar.",
    "As despesas pequenas são como fugas num barco; se as ignorar, acaba por afundar sem perceber porquê.",
    "Provisionar não é 'perder' dinheiro, é ganhar a liberdade de o gastar com consciência.",
    "Um mês terminado no verde não é fruto da sorte, é o resultado direto do seu planeamento.",
    "As suas categorias revelam as suas prioridades reais. Estão alinhadas com os seus objetivos de vida?",
    "Automatizar o registo das suas despesas recorrentes liberta espaço mental para o que realmente importa.",
    "O saldo da conta pode enganar, mas as estatísticas mostram sempre a verdade nua e crua.",
    "Analisar os gastos do passado é a única forma de garantir que não comete os mesmos erros no futuro.",
    "Sempre que o seu saldo líquido é positivo, está a financiar os sonhos do seu 'eu' de amanhã.",
    "O controlo financeiro não serve para limitar a sua liberdade, serve para a criar.",
    "Gastar sem provisão é como conduzir de olhos vendados: o embate com a fatura é inevitável.",
    "A clareza sobre os seus números é o maior luxo que pode oferecer à sua tranquilidade.",
    "Se não consegue medir, não consegue gerir. Estes gráficos são o seu painel de controlo.",
    "O dinheiro que poupa nas categorias supérfluas é o combustível para os seus grandes investimentos.",
    "A consistência na análise é o que separa quem sobrevive ao mês de quem domina as finanças.",
    "Não olhe para os gastos como perdas, olhe como dados para uma estratégia mais inteligente.",
    "Finanças pessoais são 20% matemática e 80% comportamento. Os seus dados mostram o seu hábito."
  ];

  private computeMsg(): string {
    const index = Math.floor(Math.random() * this.mensagensEstatisticas.length);
    return this.mensagensEstatisticas[index];
  }
}

/**
 * Routes for the dashboard feature module.
 */
export const routes: Routes = [
  { path: '', component: EstatisticasComponent }
];
