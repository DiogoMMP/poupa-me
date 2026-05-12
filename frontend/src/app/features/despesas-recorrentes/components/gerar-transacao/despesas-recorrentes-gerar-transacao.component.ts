import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DespesasRecorrentesGerarTransacaoViewModel } from './despesas-recorrentes-gerar-transacao.view-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component to generate a transaction for a sem-valor recurring expense.
 * Receives the despesa recorrente id from the route, loads the despesa details,
 * and lets the user fill in the valor and data to submit to the gerarTransacao endpoint.
 */
@Component({
  selector: 'app-despesas-recorrentes-gerar-transacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './despesas-recorrentes-gerar-transacao.component.html',
  styleUrls: ['./despesas-recorrentes-gerar-transacao.component.css'],
  providers: [DespesasRecorrentesGerarTransacaoViewModel]
})
export class DespesasRecorrentesGerarTransacaoComponent implements OnInit {
  public vm = inject(DespesasRecorrentesGerarTransacaoViewModel);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  despesaId: string = '';

  constructor() {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10); // YYYY-MM-DD
    this.form = this.fb.group({
      valor: this.fb.group({
        valor: [null, [Validators.required, Validators.min(0.01)]],
        moeda: ['EUR', Validators.required]
      }),
      data: [todayStr, Validators.required]
    });
  }

  ngOnInit(): void {
    this.despesaId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.despesaId) {
      this.vm.loadById(this.despesaId);
    }

    this.vm.despesa$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(despesa => {
        if (despesa?.valor != null) {
          this.form.patchValue({
            valor: {
              valor: despesa.valor,
              moeda: despesa.moeda ?? 'EUR'
            }
          });
        }
      });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.value;
      const [ano, mes, dia] = (raw.data as string).split('-').map(Number);
      this.vm.submit(this.despesaId, { valor: raw.valor, data: { dia, mes, ano } });
    }
  }
}
