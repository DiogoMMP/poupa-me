import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacoesCriarSaidasViewModel } from './transacoes-criar-saidas.view-model';

@Component({
  selector: 'app-transacoes-criar-saidas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transacoes-criar-saidas.component.html',
  styleUrls: ['./transacoes-criar-saidas.component.css'],
  providers: [TransacoesCriarSaidasViewModel]
})
export class TransacoesCriarSaidasComponent {
  public vm = inject(TransacoesCriarSaidasViewModel);
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
      contaId: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.vm.submit(this.form.value);
    }
  }
}
