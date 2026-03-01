import {Component, ChangeDetectionStrategy, OnInit, OnDestroy, Inject, PLATFORM_ID, inject} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {RouterModule, Router, Routes} from '@angular/router';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {AuthRegistarViewModel} from './auth-registar.view-model';

@Component({
  selector: 'app-auth-registar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './auth-registar.component.html',
  styleUrls: ['./auth-registar.component.css'],
  providers: [AuthRegistarViewModel],
  host: {class: 'page-auth'}
})
export class AuthRegistarComponent implements OnInit, OnDestroy {
  public vm = inject(AuthRegistarViewModel);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly year = new Date().getFullYear();

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  private isBrowser: boolean;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void this.router.navigate(['/auth/entrar']);
    };
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
    this.vm.register(this.form.value);
  }
}

/**
 * Routes for the registar feature module.
 */
export const routes: Routes = [
  { path: '', component: AuthRegistarComponent }
];
