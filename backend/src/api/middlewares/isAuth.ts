import type { Request, Response, NextFunction } from 'express';
import Logger from '../../loaders/logger.js';
import config from '../../config/index.js';
import * as jwt from 'jsonwebtoken';

/**
 * User information extracted from the authentication service.
 */
export interface AuthUser {
    id: string;
    name?: string;
    email?: string;
    role: string;
    locale?: string;
    isActive?: boolean;
}

/**
 * Extended Express Request with authenticated user information.
 */
export interface AuthenticatedRequest extends Request {
    currentUser?: AuthUser;
}

/**
 * Authentication middleware that validates a JWT locally.
 *
 * Behavior:
 * - In development, if `req.currentUser` is already set (Swagger auto-auth) we skip verification.
 * - It first tries to read the token from the Authorization header (Bearer).
 * - If missing, it will check cookies named `token` or `user-id`.
 * - The token is verified using `process.env.JWT_SECRET` (fallback to config or 'changeme').
 * - On success, `req.currentUser` is populated with the token payload (id/email/role) and next() is called.
 */
const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // In development, if Swagger auto-auth already set currentUser, skip validation
        if (process.env.NODE_ENV === 'development' && req.currentUser && req.currentUser.id) {
            Logger.debug(`[DEV] Swagger auto-auth: User already authenticated as ${req.currentUser.id}`);
            next();
            return;
        }

        // 1) Try Authorization header
        const authHeader = (req.headers && (req.headers.authorization as string)) || '';
        let token: string | undefined;

        if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
            token = authHeader.substring(7).trim();
        }

        // 2) Fallback to cookies (support both `token` and legacy `user-id` cookie if it contains a token)
        if (!token) {
            token = req.cookies?.['token'] || req.cookies?.['user-id'];
        }

        if (!token) {
            Logger.debug('No JWT token found in Authorization header or cookies');
            res.status(401).json({ status: 401, error: 'Unauthorized', message: 'No authentication token provided' });
            return;
        }

        // Verify token locally
        const secret = (process.env.JWT_SECRET || (config as any).jwtSecret || 'changeme') as jwt.Secret;

        let decoded: string | jwt.JwtPayload;
        try {
            decoded = jwt.verify(token, secret) as string | jwt.JwtPayload;
        } catch (e) {
            Logger.debug('JWT verification failed: %o', e);
            res.status(401).json({ status: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
            return;
        }

        // Extract standard fields (sub, email, role) from JWT payload
        if (!decoded || typeof decoded === 'string') {
            Logger.debug('Invalid JWT payload');
            res.status(401).json({ status: 401, error: 'Unauthorized', message: 'Invalid token payload' });
            return;
        }

        const payload = decoded as jwt.JwtPayload;
        const sub = (payload.sub && String(payload.sub)) || (payload['id'] && String(payload['id']));
        const email = (payload.email && String(payload.email)) || undefined;
        const role = (payload.role && String(payload.role)) || 'User';
        const name = (payload.name && String(payload.name)) || (email ? String(email).split('@')[0] : undefined);

        if (!sub) {
            Logger.debug('JWT payload missing subject (sub/id)');
            res.status(401).json({ status: 401, error: 'Unauthorized', message: 'Invalid token payload' });
            return;
        }

        // Attach user to request for use in controllers
        req.currentUser = {
            id: sub,
            name,
            email,
            role,
            isActive: true
        };

        Logger.debug(`User authenticated via JWT: ${req.currentUser.id} (role=${req.currentUser.role})`);
        next();
    } catch (error) {
        Logger.error('Authentication error:', error);
        res.status(500).json({ status: 500, error: 'Internal Server Error', message: 'Authentication check failed' });
        return;
    }
};

export default isAuth;

