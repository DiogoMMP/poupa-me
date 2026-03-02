import { Injectable, signal, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpEvent,
  HttpHandlerFn
} from '@angular/common/http';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UtilizadoresService } from '../../utilizadores/services/utilizadores.service';
import { SelectedBancoService } from '../../../services/selected-banco.service';

export type Role = 'Admin' | 'Guest' | 'User'

export interface User {
  id: string;
  name: string;
  role: Role;
  locale?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private users = inject(UtilizadoresService);
  private selectedBanco = inject(SelectedBancoService);

  private readonly TOKEN_KEY = 'auth_token';

  user = signal<User | null>(null);

  // flag to indicate initializeAuth has completed
  initialized = signal(false);

  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const u = await firstValueFrom(this.users.getCurrent());
      this.user.set(u as any);
      // Restore the banco the user had selected before the page refresh
      if (u && (u as any).id) {
        this.selectedBanco.initForUser((u as any).id);
      }
    } catch (err) {
      this.user.set(null);
    }
  }

  clearUser(): void {
    this.user.set(null);
  }

  // safe getter for role
  get role(): Role {
    return this.user()?.role ?? 'Guest';
  }

  logout(): void {
    // Clear client state immediately so UI updates without waiting for network
    this.user.set(null);
    this.clearToken();

    // Clear selected banco from localStorage so next user starts fresh
    this.selectedBanco.clearSelection();

    // Notify backend to clear session cookie via UsersService; ignore errors
    firstValueFrom(this.users.logout()).catch(() => {
      // ignore
    });
  }

  // Initialize auth by loading current user from session
  async initializeAuth(): Promise<void> {
    try {
      await this.loadCurrentUser();
    } catch {
      this.clearUser();
    }

    // During APP_INITIALIZER this.router.url may not reflect the requested browser path
    // so use window.location.pathname when available to detect deep links.
    const browserPath = (typeof window !== 'undefined' && window.location && window.location.pathname)
      ? window.location.pathname
      : (this.router.url || '/');

    const url = browserPath || '/';
    const isLogin = url.startsWith('/entrar');
    const u = this.user();

    // If user is already authenticated and on login page, redirect to home
    if (u && isLogin) {
      setTimeout(() => this.router.navigate(['/']), 0);
    }

    // mark initialization complete
    this.initialized.set(true);
  }

  // HTTP interceptor logic - adds credentials and handles 401/403 errors
  handleHttpInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const token = this.getToken();

    // Build headers: always send cookies, and add Bearer token when available
    let headers = request.headers;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const cloned = request.clone({ withCredentials: true, headers });

    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearUser();
          this.clearToken();
          // Only redirect to login after initialization completed.
          if (this.initialized()) {
            setTimeout(() => this.router.navigate(['/entrar']), 0);
          }
        } else if (error.status === 403) {
          setTimeout(() => {
            if (this.router.url !== '/not-authorized') this.router.navigate(['/not-authorized']);
          }, 0);
        }
        return throwError(() => error);
      })
    );
  }
}
