import { Router } from 'express';

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Health check endpoint to prevent infrastructure sleep and verify service status.
 *     responses:
 *       200:
 *         description: The server is up and running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "up"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export default (app: Router) => {
  app.get('/health', (req, res) => {
    return res.status(200).json({
      status: 'up',
      timestamp: new Date().toISOString(),
    });
  });
};
