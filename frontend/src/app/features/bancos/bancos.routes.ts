import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/bancos-listar.component').then(m => m.BancosListComponent)
  },
  /**
  {
    path: 'criar',
    loadComponent: () => import('./components/criar/banco-criar.component').then(m => m.IncidentTypesCreateComponent)
  },
  // redirect bare 'update' to list to avoid intermediate pages
  { path: 'editar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/banco-editar.component').then(m => m.IncidentTypesUpdateComponent)
  }
    */
];
