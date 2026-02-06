import { Router } from 'express';
import authRoute from "./routes/AuthRoute.js";

export default () => {
	const app = Router();

	// Register Auth routes
	authRoute(app)

	return app
}
