import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './isAuth.js';
import Logger from '../../loaders/logger.js';
import type { UserRoleType } from '../../domain/User/ValueObjects/UserRole.js';

/**
 * Roles supported by this project (kept in sync with UserRole value object)
 */
export const Role = {
  Admin: 'Admin' as UserRoleType,
  User: 'User' as UserRoleType,
  Guest: 'Guest' as UserRoleType
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

/**
 * Middleware factory for role-based authorization (RBAC).
 *
 * This middleware checks if the authenticated user has one of the allowed roles.
 * It must be used after the isAuth middleware to ensure req.currentUser is set.
 *
 * @param allowedRoles - Array of roles that are permitted to access the endpoint
 * @returns Express middleware function
 *
 * @example
 * // Allow only Admin
 * router.get('/protected', isAuth, authorize([Role.Admin]), controller.handle);
 */
const authorize = (allowedRoles: RoleType[] | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.currentUser;

      if (!user) {
        Logger.debug('Authorization failed: No authenticated user');
        res.status(401).json({
          status: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const userRole = user.role;

      // Check if user's role is in the allowed roles list (case-insensitive)
      const isAuthorized = allowedRoles.some(
        (role) => role.toLowerCase() === userRole?.toLowerCase()
      );

      if (!isAuthorized) {
        Logger.debug(`Authorization failed: User ${user.id} with role ${userRole} not in [${allowedRoles.join(', ')}]`);
        res.status(403).json({
          status: 403,
          error: 'Forbidden',
          message: 'Insufficient permissions to access this resource'
        });
        return;
      }

      Logger.debug(`Authorization successful: User ${user.id} with role ${userRole}`);
      next();
    } catch (error) {
      Logger.error('Authorization error:', error);
      res.status(500).json({
        status: 500,
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      });
      return;
    }
  };
};

export default authorize;
export { authorize };

