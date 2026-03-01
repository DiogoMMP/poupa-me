import {Component, ChangeDetectionStrategy, OnInit, OnDestroy, Inject, PLATFORM_ID, inject} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {RouterModule, Router, Routes} from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthEntrarViewModel } from './auth-entrar.view-model';

@Component({
  selector: 'app-auth-entrar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './auth-entrar.component.html',
  styleUrls: ['./auth-entrar.component.css'],
  providers: [AuthEntrarViewModel],
  host: { class: 'page-auth' }
})
export class AuthEntrarComponent implements OnInit, OnDestroy {
  public vm = inject(AuthEntrarViewModel);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly year = new Date().getFullYear();

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  private isBrowser: boolean;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') void this.router.navigate(['/dashboard']); };
    window.addEventListener('keydown', this.keyHandler);
  }

  ngOnDestroy(): void {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.vm.error.set('Por favor preencha todos os campos corretamente');
      return;
    }
    this.vm.login(this.form.value);
  }
}

/**
 * Routes for the Entrar feature module.
 */
export const routes: Routes = [
  { path: '', component: AuthEntrarComponent }
];
