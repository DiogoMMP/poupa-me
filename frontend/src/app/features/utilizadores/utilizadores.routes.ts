import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/utilizadores-listar.component').then(m => m.UtilizadoresListComponent)
  }
];

