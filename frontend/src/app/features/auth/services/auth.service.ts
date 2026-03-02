import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  user = signal<User | null>(null);

  // flag to indicate initializeAuth has completed
  initialized = signal(false);

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  setUserToStorage(u: User): void {
    if (this.isBrowser) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    }
  }

  getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  clearUserFromStorage(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const u = await firstValueFrom(this.users.getCurrent());
      const userObj: User = {
        id: (u as any).id,
        name: (u as any).name,
        role: (u as any).role,
        locale: (u as any).locale ?? 'pt'
      };
      this.user.set(userObj);
      this.setUserToStorage(userObj);
      if (userObj.id) {
        this.selectedBanco.initForUser(userObj.id);
      }
    } catch (err) {
      // Backend unreachable or session/token expired — try localStorage fallback
      const saved = this.getUserFromStorage();
      if (saved && this.getToken()) {
        // We have a saved user and token; restore the session from local state
        this.user.set(saved);
        this.selectedBanco.initForUser(saved.id);
      } else {
        // No valid local state — clear everything
        this.user.set(null);
        this.clearUserFromStorage();
        this.clearToken();
      }
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
    this.user.set(null);
    this.clearToken();
    this.clearUserFromStorage();
    this.selectedBanco.clearSelection();

    firstValueFrom(this.users.logout()).catch(() => {
      // ignore
    });
  }

  // Initialize auth — restore from localStorage first, then validate with backend
  async initializeAuth(): Promise<void> {
    // Immediately restore user from localStorage so the UI doesn't flash "not logged in"
    if (this.isBrowser) {
      const saved = this.getUserFromStorage();
      const token = this.getToken();
      if (saved && token) {
        this.user.set(saved);
        this.selectedBanco.initForUser(saved.id);
      }
    }

    // Then validate/refresh from backend (updates name, role, etc.)
    try {
      await this.loadCurrentUser();
    } catch {
      this.clearUser();
    }

    const browserPath = (typeof window !== 'undefined' && window.location && window.location.pathname)
      ? window.location.pathname
      : (this.router.url || '/');

    const url = browserPath || '/';
    const isLogin = url.startsWith('/entrar');
    const u = this.user();

    if (u && isLogin) {
      setTimeout(() => this.router.navigate(['/']), 0);
    }

    this.initialized.set(true);
  }

  // HTTP interceptor — adds Bearer token and handles 401/403
  handleHttpInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const token = this.getToken();

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
          this.clearUserFromStorage();
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


