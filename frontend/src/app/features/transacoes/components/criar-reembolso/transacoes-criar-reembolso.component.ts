import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesCriarReembolsoViewModel } from './transacoes-criar-reembolso.view-model';

@Component({
  selector: 'app-transacoes-criar-reembolso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transacoes-criar-reembolso.component.html',
  styleUrls: ['./transacoes-criar-reembolso.component.css'],
  providers: [TransacoesCriarReembolsoViewModel]
})
export class TransacoesCriarReembolsoComponent {
  public vm = inject(TransacoesCriarReembolsoViewModel);
  private fb = inject(FormBuilder);

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

  onSubmit() {
    if (this.form.valid) {
      this.vm.submit(this.form.value);
    }
  }
}
