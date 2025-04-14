import { loadUserPermissions, checkPermission } from '../../rbacMiddleware';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

describe('RBAC Middleware', () => {
  let req, res, next, prismaMock;

  beforeEach(() => {
    req = { user: { userId: 'user123' } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    prismaMock = new PrismaClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadUserPermissions', () => {
    it('should attach permissions when user has roles and permissions', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        roles: [
          {
            role: {
              permissions: [
                { permission: { resource: 'orders', action: 'read' } },
                { permission: { resource: 'orders', action: 'write' } },
              ],
            },
          },
        ],
      });

      await loadUserPermissions(req, res, next);

      expect(req.user.permissions).toBeInstanceOf(Set);
      expect(req.user.permissions.has('orders:read')).toBe(true);
      expect(req.user.permissions.has('orders:write')).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no req.user', async () => {
      req.user = null;

      await loadUserPermissions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No user info' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await loadUserPermissions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle user with no roles gracefully', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        roles: [],
      });

      await loadUserPermissions(req, res, next);

      expect(req.user.permissions).toBeInstanceOf(Set);
      expect(req.user.permissions.size).toBe(0);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

      await loadUserPermissions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('should allow access if user has permission', () => {
      req.user.permissions = new Set(['orders:read']);

      const middleware = checkPermission('orders:read');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user lacks permission', () => {
      req.user.permissions = new Set(['orders:read']);

      const middleware = checkPermission('orders:write');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if permissions are missing', () => {
      req.user.permissions = new Set();

      const middleware = checkPermission('orders:read');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if req.user is missing', () => {
      req.user = null;

      const middleware = checkPermission('orders:read');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});