import { Routes } from '@angular/router';

// Routes for the transactions feature
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/transacoes-listar.component').then(m => m.TransacoesListComponent)
  },
  {
    path: 'criar-entradas',
    loadComponent: () => import('./components/criar-entradas/transacoes-criar-entradas.component').then(m => m.TransacoesCriarEntradasComponent)
  },
  {
    path: 'criar-saidas',
    loadComponent: () => import('./components/criar-saidas/transacoes-criar-saidas.component').then(m => m.TransacoesCriarSaidasComponent)
  },
  {
    path: 'criar-credito',
    loadComponent: () => import('./components/criar-credito/transacoes-criar-credito.component').then(m => m.TransacoesCriarCreditoComponent)
  },
  {
    path: 'criar-reembolso',
    loadComponent: () => import('./components/criar-reembolso/transacoes-criar-reembolso.component').then(m => m.TransacoesCriarReembolsoComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./components/editar/transacoes-editar.component').then(m => m.TransacoesEditarComponent)
  }
];
