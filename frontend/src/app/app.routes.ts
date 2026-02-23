import { Routes } from '@angular/router';
import {AppLayoutComponent} from './layout/app-layout.component';
import { RoleGuard } from './guards/role.guard';
import { NoLoginGuard } from './guards/no-login.guard';

/**
 * Application routes configuration.
 * Defines the main layout and lazy-loaded feature modules.
 */
export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [NoLoginGuard],
    loadChildren: () => import('./features/auth/auth.component').then(m => m.routes)
  },

  {
    path: '',
    component: AppLayoutComponent,
    canActivateChild: [RoleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.component').then(m => m.routes), data: { allowedRoles: ['Admin','User'] } },

      { path: 'bancos', loadChildren: () => import('./features/bancos/bancos.routes').then(m => m.routes), data: { allowedRoles: ['Admin','User'] } },

      { path: 'contas', loadChildren: () => import('./features/contas/contas.routes').then(m => m.routes), data: { allowedRoles: ['Admin','User'] } },

      { path: 'cartoes-credito', loadChildren: () => import('./features/cartoes-credito/cartoes-credito.routes').then(m => m.routes), data: { allowedRoles: ['Admin','User'] } },

      { path: 'transacoes', loadChildren: () => import('./features/transacoes/transacoes.routes').then(m => m.routes), data: { allowedRoles: ['Admin','User'] } },

      { path: 'categorias', loadChildren: () => import('./features/categorias/categorias.routes').then(m => m.routes), data: { allowedRoles: ['Admin'] } },

      //{ path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.routes), data: { allowedRoles: ['Admin'] } },

      // Admin user creation (lazy-loaded feature)
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.routes), data: { allowedRoles: ['Admin'] } },

      // Not authorized route (accessible without matching other feature routes)
      { path: 'not-authorized', loadChildren: () => import('./features/not_authorized/not_authorized.component').then(m => m.routes) },
      { path: '**', loadChildren: () => import('./features/not_found/not_found.component').then(m => m.routes) }
    ]
  }

];
