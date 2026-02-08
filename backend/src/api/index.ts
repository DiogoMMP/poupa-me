import { Router } from 'express';
import authRoute from "./routes/AuthRoute.js";
import categoriaRoute from "./routes/CategoriaRoute.js";

export default () => {
	const app = Router();

	// Register Auth routes
	authRoute(app)

	// Register Categoria routes
	categoriaRoute(app)

	return app
}
