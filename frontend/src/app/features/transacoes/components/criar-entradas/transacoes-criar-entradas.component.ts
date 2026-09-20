import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesCriarEntradasViewModel } from './transacoes-criar-entradas.view-model';
import { IaCategorizacaoService } from '../../../ia-categorizacao/ia-categorizacao.service';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { ToSelectOptionsPipe } from '../../../../shared/pipes/to-select-options.pipe';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { MoneyInputComponent } from '../../../../shared/components/money-input/money-input.component';
import { getTodayIso } from '../../../../shared/utils/date-formatter.util';
@Component({
  selector: 'app-transacoes-criar-entradas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent, SelectComponent, ToSelectOptionsPipe, DatePickerComponent, MoneyInputComponent],
  templateUrl: './transacoes-criar-entradas.component.html',
  styleUrls: ['./transacoes-criar-entradas.component.css'],
  providers: [TransacoesCriarEntradasViewModel]
})
export class TransacoesCriarEntradasComponent {
  public vm = inject(TransacoesCriarEntradasViewModel);
  private fb = inject(FormBuilder);
  private iaCategorizacaoService = inject(IaCategorizacaoService);

  form: FormGroup;
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
      contaId: ['', Validators.required],
    });
  }

  onDescricaoBlur() {
    const descricao = this.form.get('descricao')?.value;
    if (descricao) {
      this.iaCategorizacaoService.sugerir(descricao).subscribe(categoria => {
        if (categoria) {
          this.form.get('categoriaId')?.setValue(categoria.id);
        }
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.vm.submit(this.form.value);
    }
  }
}
