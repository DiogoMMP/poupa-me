import { Router } from 'express';
import transacaoRoute from './TransacaoRoute.js';
import transacaoContaQueryRoute from './TransacaoContaQueryRoute.js';
import transacaoCartaoQueryRoute from './TransacaoCartaoQueryRoute.js';

export default (app: Router) => {
  transacaoContaQueryRoute(app);
  transacaoCartaoQueryRoute(app);
  transacaoRoute(app);
};
