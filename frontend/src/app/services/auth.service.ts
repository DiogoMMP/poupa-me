import { Injectable, signal, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpRequest,
  HttpEvent,
  HttpHandlerFn
} from '@angular/common/http';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from './users.service';

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
  private http = inject(HttpClient);
  private router = inject(Router);
  private users = inject(UsersService);

  user = signal<User | null>(null);

  // flag to indicate initializeAuth has completed
  initialized = signal(false);

  async loadCurrentUser(): Promise<void> {
    try {
      // use UsersService to get current user
      const u = await firstValueFrom(this.users.getCurrent());
      this.user.set(u as any);
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
    // Ensure cookies are sent with every request (for session-based auth)
    const cloned = request.clone({ withCredentials: true });

    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearUser();
          // Only redirect to login after initialization completed. If initializeAuth
          // is still running (initialized() === false), don't perform navigation here;
          // the app will allow route guards or later logic to handle navigation.
          if (this.initialized()) {
            setTimeout(() => this.router.navigate(['/entrar']), 0);
          }
        } else if (error.status === 403) {
          // Do not clear user on 403; just navigate to not authorized page
          setTimeout(() => {
            // Avoid repeated navigations
            if (this.router.url !== '/not-authorized') this.router.navigate(['/not-authorized']);
          }, 0);
        }
        return throwError(() => error);
      })
    );
  }
}
