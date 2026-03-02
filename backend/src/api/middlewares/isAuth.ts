import type { Request, Response, NextFunction } from 'express';
import Logger from '../../loaders/logger.js';

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
 * Authentication middleware that supports both JWT Bearer tokens and session-based auth.
 *
 * Behavior:
 * - In development, if `req.currentUser` is already set (Swagger auto-auth) we skip verification.
 * - First checks the Authorization header for a Bearer JWT token.
 * - Falls back to checking req.session.user (express-session).
 * - On success, `req.currentUser` is populated and next() is called.
 */
const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // In development, if Swagger auto-auth already set currentUser, skip validation
        if (process.env.NODE_ENV === 'development' && req.currentUser) {
            next();
            return;
        }

        // --- JWT Bearer token authentication ---
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jwtModule: any = await import('jsonwebtoken');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                const verifyFn: Function | undefined = jwtModule.verify || jwtModule.default?.verify;
                if (typeof verifyFn === 'function') {
                    const secret = process.env.JWT_SECRET || 'changeme';
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const payload: any = verifyFn(token, secret);
                    req.currentUser = {
                        id: payload.sub as string,
                        email: payload.email,
                        role: payload.role || 'User',
                        isActive: true
                    };
                    next();
                    return;
                }
            } catch (jwtError) {
                Logger.debug('isAuth: invalid JWT token: %o', jwtError);
                // Fall through to session check
            }
        }

        // --- Session-based authentication ---
        if (!req.session || !req.session.user) {
            res.status(401).json({
                status: 401,
                error: 'Unauthorized',
                message: 'Not authenticated. Please login.'
            });
            return;
        }

        // Populate currentUser from session
        const sessionUser = req.session.user;
        req.currentUser = {
            id: sessionUser.id,
            name: sessionUser.name,
            email: sessionUser.email,
            role: sessionUser.role || 'User',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            locale: (sessionUser as any).locale,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isActive: (sessionUser as any).isActive !== false
        };

        next();
    } catch (error) {
        Logger.error('isAuth middleware error: %o', error);
        res.status(500).json({
            status: 500,
            error: 'Internal Server Error',
            message: 'Authentication check failed'
        });
    }
};

export default isAuth;

/**
 * Returns the effective userId to use in repo/service queries.
 * Admins receive undefined so that no userId filter is applied and all records are returned.
 * Normal users receive their own id so that only their records are returned.
 */
export function getEffectiveUserId(req: AuthenticatedRequest): string | undefined {
    const user = req.currentUser;
    if (!user) return undefined;
    if (user.role === 'Admin') return undefined;
    return user.id;
}

