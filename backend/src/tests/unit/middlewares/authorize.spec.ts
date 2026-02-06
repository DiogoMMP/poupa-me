/**
 * Unit tests for authorize middleware (RBAC)
 *
 * The authorize middleware implements Role-Based Access Control.
 * Currently available for future use when role-restricted endpoints are added.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock logger
jest.mock('../../../loaders/logger.js', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  }
}));

import authorize, { Role } from '../../../api/middlewares/authorize.js';
import type { AuthenticatedRequest } from '../../../api/middlewares/isAuth.js';
import type { Response, NextFunction } from 'express';

describe('authorize Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn().mockReturnThis() as jest.Mock;
    statusMock = jest.fn().mockReturnValue({ json: jsonMock }) as jest.Mock;

    mockReq = {};

    mockRes = {
      status: statusMock as any,
      json: jsonMock as any
    };

    mockNext = jest.fn();
  });

  describe('Role enum', () => {
    it('should match C# Domain.Model.User.ValueObjects.Role', () => {
      expect(Role.Guest).toBe('Guest');
      expect(Role.Pending).toBe('Pending');
      expect(Role.Admin).toBe('Admin');
      expect(Role.LogisticsOperator).toBe('LogisticsOperator');
      expect(Role.PortAuthority).toBe('PortAuthority');
      expect(Role.ShippingAgentRepresentative).toBe('ShippingAgentRepresentative');
    });
  });

  describe('authorization checks', () => {
    it('should return 401 when no user is authenticated', () => {
      mockReq.currentUser = undefined;

      const middleware = authorize([Role.Admin]);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext as unknown as NextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when user has allowed role', () => {
      mockReq.currentUser = { id: 'user-123', name: 'Admin User', role: 'Admin' };

      const middleware = authorize([Role.Admin]);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext as unknown as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not allowed', () => {
      mockReq.currentUser = { id: 'user-123', name: 'Guest User', role: 'Guest' };

      const middleware = authorize([Role.Admin]);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext as unknown as NextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
