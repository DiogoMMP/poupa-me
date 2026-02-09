import { Router } from 'express';
import authRoute from "./routes/AuthRoute.js";
import categoriaRoute from "./routes/CategoriaRoute.js";
import transacaoRoute from "./routes/TransacaoRoute.js";

export default () => {
	const app = Router();

	// Register Auth routes
	authRoute(app)

	// Register Categoria routes
	categoriaRoute(app)

	// Register Transacao routes
	transacaoRoute(app);

	return app
}
