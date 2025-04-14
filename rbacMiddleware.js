import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Middleware to load user's roles and permissions from the database.
 * Attaches a Set of permission strings to req.user.permissions.
 */
async function loadUserPermissions(req, res, next) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Unauthorized: No user info' });
  }

  try {
    const userWithRoles = await prisma.user.findUnique({
      where: { user_id: req.user.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    const permissionsSet = new Set();

    for (const userRole of userWithRoles.roles) {
      const role = userRole.role;
      for (const rolePermission of role.permissions) {
        const perm = rolePermission.permission;
        permissionsSet.add(`${perm.resource}:${perm.action}`);
      }
    }

    req.user.permissions = permissionsSet;
    next();
  } catch (error) {
    console.error('Error loading user permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Middleware factory to check if user has a required permission.
 * Usage: app.get('/route', authenticateToken, loadUserPermissions, checkPermission('resource:action'), handler)
 */
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user?.permissions?.has(requiredPermission)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

export { loadUserPermissions, checkPermission };