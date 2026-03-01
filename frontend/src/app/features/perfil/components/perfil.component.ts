import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PerfilViewModel } from './perfil.view-model';
import { AtualizarPerfilDTO } from '../dto/perfil.dto';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  providers: [PerfilViewModel]
})
export class PerfilComponent implements OnInit {
  public vm = inject(PerfilViewModel);
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name:            [''],
    password:        [''],
    passwordConfirm: ['']
  });

  get passwordMismatch(): boolean {
    const p = this.form.value.password;
    const c = this.form.value.passwordConfirm;
    return !!p && !!c && p !== c;
  }

  ngOnInit(): void {
    this.vm.loadData();
    this.vm.perfil$.subscribe(p => {
      if (p) this.form.patchValue({ name: p.nome });
    });
  }

  onSubmit(): void {
    if (this.passwordMismatch) return;
    const raw = this.form.value;
    const payload: AtualizarPerfilDTO = {
      name:     raw.name     || undefined,
      password: raw.password || undefined,
    };
    this.vm.save(payload);
  }
}
