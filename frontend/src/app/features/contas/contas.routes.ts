import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/contas-listar.component').then(m => m.ContasListComponent)
  },

  {
    path: 'criar',
    loadComponent: () => import('./components/criar/contas-criar.component').then(m => m.ContasCriarComponent)
  },

  // redirect bare 'update' to list to avoid intermediate pages
  { path: 'editar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/contas-editar.component').then(m => m.ContasEditarComponent)
  }
];
