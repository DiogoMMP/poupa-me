import { Routes } from '@angular/router';

// Routes for the transactions feature
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/listar/despesas-recorrentes-listar.component').then(m => m.DespesasRecorrentesListComponent)
  },
  {
    path: 'gerar-transacao/:id',
    loadComponent: () => import('./components/gerar-transacao/despesas-recorrentes-gerar-transacao.component').then(m => m.DespesasRecorrentesGerarTransacaoComponent)
  },
  {
    path: 'nova-regra',
    loadComponent: () => import('./components/nova-regra/despesas-recorrentes-nova-regra.component').then(m => m.DespesasRecorrentesNovaRegraComponent)
  },
  {
    path: 'listar-regras',
    loadComponent: () => import('./components/listar-regras/despesas-recorrentes-listar-regras.component').then(m => m.DespesasRecorrentesListarRegrasComponent)
  },
  {
    path: 'editar-transacao/:id',
    loadComponent: () => import('./components/editar-transacao/transacoes-editar.component').then(m => m.DespesasRecorrentesEditarTransacaoComponent)
  },
  {
    path: 'editar-regra/:id',
    loadComponent: () => import('./components/editar-regra/despesas-recorrentes-editar-regra.component').then(m => m.DespesasRecorrentesEditarRegraComponent)
  },
];
