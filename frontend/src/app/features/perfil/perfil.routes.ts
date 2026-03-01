import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/perfil.component').then(m => m.PerfilComponent)
  }
];
