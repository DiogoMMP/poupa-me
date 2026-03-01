import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class NoLoginGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Wait for auth.initialized to become true (with timeout) then decide
  async canActivate(): Promise<boolean | UrlTree> {
    const timeoutMs = 1000;
    const intervalMs = 30;
    let waited = 0;

    while (!this.auth.initialized() && waited < timeoutMs) {
      await new Promise(res => setTimeout(res, intervalMs));
      waited += intervalMs;
    }

    const u = this.auth.user();
    if (u) return this.router.parseUrl('/');
    return true;
  }
}
