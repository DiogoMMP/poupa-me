import { Component, ChangeDetectionStrategy, signal, Inject, OnInit, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Routes, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
import type { LoginCredentials, AuthResponse } from './data/auth.model';

@Component({
  selector: 'app-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  host: { class: 'page-auth' }
})
export class AuthComponent implements OnInit, OnDestroy {
  readonly year = new Date().getFullYear();

  // ViewModel signals
  message = signal('Entrar');
  loading = signal(false);
  error = signal<string | null>(null);

  // Form
  loginForm: FormGroup;

  private isBrowser = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private notifier: NotificationService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId as Object);

    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // attach escape key handler
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.close(); };
    window.addEventListener('keydown', keyHandler);
    (this as any).__authKeyHandler = keyHandler;
  }

  ngOnDestroy(): void {
    // remove keyboard handler
    try {
      if ((this as any).__authKeyHandler) {
        window.removeEventListener('keydown', (this as any).__authKeyHandler);
      }
    } catch (e) {}
  }

  /**
   * Handle login form submission
   */
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.error.set('Por favor preencha todos os campos corretamente');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const credentials: LoginCredentials = this.loginForm.value;

      // Call backend login endpoint
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${environment.apiBaseUrl}/auth/login`,
          credentials,
          { withCredentials: true }
        )
      );

      // Update auth service with user data
      this.auth.user.set({
        id: response.user.id,
        name: response.user.name,
        role: response.user.role as any,
        locale: 'pt'
      });

      // Show success notification
      this.notifier.success(`Bem-vindo, ${response.user.name}!`);

      // Navigate to dashboard
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = 'Credenciais inválidas. Tente novamente.';
      this.error.set(errorMsg);
      this.notifier.error(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Navigate to dashboard / close auth modal
   */
  close(): void {
    try {
      void this.router.navigateByUrl('/dashboard');
    } catch (err) {
      window.history.back();
    }
  }
}

export const routes: Routes = [
  { path: '', component: AuthComponent }
];
