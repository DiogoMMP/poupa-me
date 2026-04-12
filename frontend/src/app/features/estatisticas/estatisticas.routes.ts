import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/estatisticas.component').then(m => m.EstatisticasComponent)
  }
];
