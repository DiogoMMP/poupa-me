import { Injectable, inject } from '@angular/core';
import { CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';
import { MenuService } from '../services/menu.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivateChild {
  private auth = inject(AuthService);
  private menu = inject(MenuService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private isUrlAllowedByRoute(allowedRoute: string, url?: string): boolean {
    if (!allowedRoute || !url) return false;
    // normalize leading slashes so comparisons work whether routes in menu have '/' or not
    const normalize = (s: string) => s.startsWith('/') ? s : '/' + s;
    const a = normalize(allowedRoute);
    const u = url.startsWith('/') ? url : '/' + url;
    // exact match or subpath match (allowedRoute + '/') as prefix
    return u === a || u.startsWith(a + '/');
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // allow wildcard
    if (!childRoute || !childRoute.routeConfig || childRoute.routeConfig.path === '**') return true;

    const currentUser = this.auth.user();
    const url = state.url;

    // If auth initialization hasn't completed yet, do not attempt to redirect — allow navigation to proceed
    if (!this.auth.initialized()) {
      return true;
    }

    // 1) Check route data.allowedRoles first
    const allowedRoles = (childRoute.data?.['allowedRoles'] as string[] | undefined) ?? undefined;
    if (allowedRoles && allowedRoles.length > 0) {
      if (!currentUser) {
        // Not logged in: redirect to entrar
        return this.router.parseUrl('/entrar');
      }
      const role = currentUser.role;
      if (allowedRoles.includes(role)) {
        return true;
      }
      // Fire-and-forget probe to server to generate a 403 log with a specific path
      const probeRole = allowedRoles[0];
      try {
        this.http.get(`${environment.apiBaseUrl}/auth/check-role/${encodeURIComponent(probeRole)}`, { withCredentials: true }).subscribe({ next: () => {}, error: () => {} });
      } catch { /* ignore */ }
      return this.router.parseUrl('/not-authorized');
    }

    // 2) Fallback to menu-driven allow list (legacy)
    const role = this.auth.role;
    const allowed = this.menu.filteredForRole(role)().flatMap(item => {
      const collect = (it: any): string[] => [it.route || ''].concat((it.children || []).flatMap((c: any) => collect(c)));
      return collect(item);
    }).filter(r => !!r) as string[];

    const hiddenAllowed: string[] = ['/not-authorized'];
    const combined = allowed.concat(hiddenAllowed);

    const isAllowed = combined.some(r => this.isUrlAllowedByRoute(r, url));
    if (isAllowed) return true;

    // if route is unknown, allow router to resolve to 404
    const urlPath = url.split('?')[0].split('#')[0];
    const segments = urlPath.split('/').filter(s => !!s);
    const firstSeg = segments[0] || '';

    const topLevelPaths = (this.router.config || []).map(r => r.path || '');
    let childPaths: string[] = [];
    const layoutRoute = (this.router.config || []).find(r => r.path === '' && Array.isArray(r.children));
    if (layoutRoute && layoutRoute.children) {
      childPaths = layoutRoute.children.map((c: any) => c.path || '');
    }

    const allPaths = topLevelPaths.concat(childPaths);
    const normalizeFirst = (p: string) => (p || '').split('/')[0];

    const routeExists = allPaths.some(p => {
      const pFirst = normalizeFirst(p);
      if (pFirst === '') return firstSeg === '';
      if (pFirst.startsWith(':')) return true;
      return pFirst === firstSeg;
    });

    if (!routeExists) return true;

    return this.router.parseUrl('/not-authorized');
  }
}
