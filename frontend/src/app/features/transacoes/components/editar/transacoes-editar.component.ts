import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TransacoesEditarViewModel } from './transacoes-editar.view-model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SelectComponent, AppSelectOption } from '../../../../shared/components/select/select.component';
import { ToSelectOptionsPipe } from '../../../../shared/pipes/to-select-options.pipe';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { MoneyInputComponent } from '../../../../shared/components/money-input/money-input.component';
import { getTodayIso } from '../../../../shared/utils/date-formatter.util';
@Component({
  selector: 'app-transacoes-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent, SelectComponent, ToSelectOptionsPipe, DatePickerComponent, MoneyInputComponent],
  templateUrl: './transacoes-editar.component.html',
  styleUrls: ['./transacoes-editar.component.css'],
  providers: [TransacoesEditarViewModel]
})
export class TransacoesEditarComponent implements OnInit {
  public vm = inject(TransacoesEditarViewModel);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  form: FormGroup;

  readonly statusOptions: AppSelectOption[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Concluído', label: 'Concluído' },
  ];
  readonly todayIso = getTodayIso();

  constructor() {
    this.form = this.fb.group({
      data: ['', Validators.required],
      descricao: ['', Validators.required],
      valor: this.fb.group({
        valor: [0, [Validators.required, Validators.min(0.01)]],
        moeda: ['EUR', Validators.required]
      }),
      categoriaId: ['', Validators.required],
      contaId: [''],
      cartaoCreditoId: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.vm.load(id);

    this.vm.transacao$.subscribe(t => {
      if (!t) return;
      // patch common fields
      const d = t.data;
      const iso = `${d.ano.toString().padStart(4,'0')}-${d.mes.toString().padStart(2,'0')}-${d.dia.toString().padStart(2,'0')}`;
      this.form.patchValue({
        data: iso,
        descricao: t.descricao,
        valor: { valor: t.valor.valor, moeda: t.valor.moeda },
        categoriaId: t.categoria?.id || '',
        status: t.status || ''
      });

      // patch account or card specific
      if (t.conta) {
        this.form.patchValue({ contaId: t.conta.id, cartaoCreditoId: '' });
      } else if (t.cartaoCredito) {
        this.form.patchValue({ cartaoCreditoId: t.cartaoCredito.id, contaId: '' });
      }
    });
  }

  onSubmit() {
    // mark all controls as touched so validation messages show
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // do not submit; validation messages will guide the user
      return;
    }

    this.vm.update(this.form.value);
  }
}
