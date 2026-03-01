import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/bancos-listar.component').then(m => m.BancosListComponent)
  },

  {
    path: 'criar',
    loadComponent: () => import('./components/criar/bancos-criar.component').then(m => m.BancosCriarComponent)
  },

  // redirect bare 'update' to list to avoid intermediate pages
  { path: 'editar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/bancos-editar.component').then(m => m.BancosEditarComponent)
  }
];
