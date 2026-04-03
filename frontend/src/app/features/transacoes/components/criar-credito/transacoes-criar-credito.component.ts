import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesCriarCreditoViewModel } from './transacoes-criar-credito.view-model';
import { IaCategorizacaoService } from '../../../ia-categorizacao/ia-categorizacao.service';

@Component({
  selector: 'app-transacoes-criar-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transacoes-criar-credito.component.html',
  styleUrls: ['./transacoes-criar-credito.component.css'],
  providers: [TransacoesCriarCreditoViewModel]
})
export class TransacoesCriarCreditoComponent {
  public vm = inject(TransacoesCriarCreditoViewModel);
  private fb = inject(FormBuilder);
  private iaCategorizacaoService = inject(IaCategorizacaoService);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      data: ['', Validators.required],
      descricao: ['', Validators.required],
      valor: this.fb.group({
        valor: [0, [Validators.required, Validators.min(0.01)]],
        moeda: ['EUR', Validators.required]
      }),
      categoriaId: ['', Validators.required],
      cartaoCreditoId: ['', Validators.required],
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
