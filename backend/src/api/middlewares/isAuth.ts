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
 * Authentication middleware that validates session-based authentication.
 *
 * Behavior:
 * - In development, if `req.currentUser` is already set (Swagger auto-auth) we skip verification.
 * - Checks if req.session.user exists (populated by express-session after login)
 * - On success, `req.currentUser` is populated with the session user data and next() is called.
 */
const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // In development, if Swagger auto-auth already set currentUser, skip validation
        // Note: id may be undefined for Swagger admin (no userId filter applied in repos)
        if (process.env.NODE_ENV === 'development' && req.currentUser) {
            // Skip session validation for Swagger auto-auth
            next();
            return;
        }

        // Check if user is authenticated via session
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
            locale: (sessionUser as any).locale,
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

