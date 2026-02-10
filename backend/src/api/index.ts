import { Router } from 'express';
import authRoute from "./routes/AuthRoute.js";
import categoriaRoute from "./routes/CategoriaRoute.js";
import transacaoRoute from "./routes/TransacaoRoute.js";
import contaRoute from "./routes/ContaRouter.js";

export default () => {
	const app = Router();

	// Register Auth routes
	authRoute(app)

	// Register Categoria routes
	categoriaRoute(app)

	// Register Transacao routes
	transacaoRoute(app);

	// Register Conta routes
	contaRoute(app);

	return app
}
