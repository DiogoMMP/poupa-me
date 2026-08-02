import { Router } from 'express';
import authRoute from "./routes/AuthRoute.js";
import categoriaRoute from "./routes/CategoriaRoute.js";
import transacaoRoute from "./routes/Transacao/index.js";
import contaRoute from "./routes/ContaRoute.js";
import cartaoCreditoRoute from "./routes/CartaoCreditoRoute.js";
import bancoRoute from "./routes/BancoRoute.js";
import despesaRecorrenteRoute from "./routes/DespesaRecorrente/index.js";
import iACategorizacaoRoute from "./routes/IACategorizacaoRoute.js";
import healthRoute from "./routes/Health.js"
import estatisticasRoute from "./routes/EstatisticasRoute.js";
import dashboardRoute from "./routes/DashboardRoute.js";

export default () => {
	const app = Router();

	// Register Health route
	healthRoute(app);

	// Register Auth routes
	authRoute(app)

	// Register Categoria routes
	categoriaRoute(app)

	// Register Transacao routes
	transacaoRoute(app);

	// Register Conta routes
	contaRoute(app);

	// Register CartaoCredito routes
	cartaoCreditoRoute(app);

	// Register Banco routes
	bancoRoute(app);

	// Register DespesaRecorrente routes
	despesaRecorrenteRoute(app);

	// Register AI Categorization routes
	iACategorizacaoRoute(app);

	// Register Estatisticas routes
	estatisticasRoute(app);

	// Register Dashboard routes
	dashboardRoute(app);

	return app
}
