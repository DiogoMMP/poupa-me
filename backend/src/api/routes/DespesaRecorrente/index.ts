import { Router } from 'express';
import despesaRecorrenteRoute from './DespesaRecorrenteRoute.js';
import despesaRecorrenteProcessadorRoute from './DespesaRecorrenteProcessadorRoute.js';

export default (app: Router) => {
  despesaRecorrenteRoute(app);
  despesaRecorrenteProcessadorRoute(app);
};
