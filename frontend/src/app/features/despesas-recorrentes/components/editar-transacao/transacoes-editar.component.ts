import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DespesasRecorrentesEditarTransacaoViewModel } from './transacoes-editar.view-model';

@Component({
  selector: 'app-despesas-recorrentes-editar-transacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transacoes-editar.component.html',
  styleUrls: ['./transacoes-editar.component.css'],
  providers: [DespesasRecorrentesEditarTransacaoViewModel]
})
export class DespesasRecorrentesEditarTransacaoComponent implements OnInit {
  public vm = inject(DespesasRecorrentesEditarTransacaoViewModel);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    data: ['', Validators.required],
    valor: this.fb.group({
      valor: [null, [Validators.required, Validators.min(0.01)]],
      moeda: ['EUR', Validators.required]
    })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.vm.load(id);

    this.vm.transacao$.subscribe(t => {
      if (!t) return;
      const d = t.data;
      const iso = `${d.ano.toString().padStart(4, '0')}-${d.mes.toString().padStart(2, '0')}-${d.dia.toString().padStart(2, '0')}`;
      this.form.patchValue({
        data: iso,
        valor: { valor: t.valor.valor, moeda: t.valor.moeda }
      });
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.value;
    const [ano, mes, dia] = (raw.data as string).split('-').map(Number);
    this.vm.update({ dia, mes, ano }, { valor: +raw.valor.valor, moeda: raw.valor.moeda });
  }
}
