import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/cartoes-credito-listar.component').then(m => m.CartoesCreditoListComponent)
  },

  {
    path: 'criar',
    loadComponent: () => import('./components/criar/cartoes-credito-criar.component').then(m => m.CartoesCreditoCriarComponent)
  },

  // redirect bare 'update' to list to avoid intermediate pages
  { path: 'editar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/cartoes-credito-editar.component').then(m => m.CartoesCreditoEditarComponent)
  },

  // redirect bare 'pagar' to list to avoid intermediate pages
  { path: 'pagar', redirectTo: '', pathMatch: 'full' },
  {
    path: 'pagar/:id',
    loadComponent: () => import('./components/pagar/cartoes-credito-pagar.component').then(m => m.CartoesCreditoPagarComponent)
  }
];
