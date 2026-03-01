import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'entrar',
    loadComponent: () => import('./components/entrar/auth-entrar.component').then(m => m.AuthEntrarComponent)
  },
  {
    path: 'registar',
    loadComponent: () => import('./components/registar/auth-registar.component').then(m => m.AuthRegistarComponent)
  },
  {
    path: '',
    redirectTo: 'entrar',
    pathMatch: 'full'
  }
];

