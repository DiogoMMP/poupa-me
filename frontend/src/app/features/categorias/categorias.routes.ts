import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/categorias-listar.component').then(m => m.CategoriasListComponent)
  },

  {
    path: 'criar',
    loadComponent: () => import('./components/criar/categorias-criar.component').then(m => m.CategoriasCriarComponent)
  },

  // redirect bare 'update' to list to avoid intermediate pages
  { path: 'editar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/categorias-editar.component').then(m => m.CategoriasEditarComponent)
  }
];
