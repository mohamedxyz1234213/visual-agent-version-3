// Role hierarchy and permission checking middleware

const ROLE_HIERARCHY = {
  'super-admin': ['super-admin', 'admin', 'teacher', 'student', 'parent'],
  admin: ['admin', 'teacher', 'student', 'parent'],
  teacher: ['teacher', 'student'],
  student: ['student'],
  parent: ['parent'],
};

const PERMISSIONS = {
  'users:create': ['super-admin', 'admin'],
  'users:delete': ['super-admin', 'admin'],
  'users:read': ['super-admin', 'admin', 'teacher'],
  'users:update': ['super-admin', 'admin'],
  'students:assign-teacher': ['super-admin', 'admin'],
  'lessons:create': ['teacher', 'admin', 'super-admin'],
  'lessons:delete': ['teacher', 'admin', 'super-admin'],
  'exams:grade-all': ['teacher', 'admin'],
  'system-logs:read': ['super-admin', 'admin'],
  'ai-logs:read': ['super-admin', 'admin'],
  'settings:modify': ['super-admin'],
  'content:moderate': ['super-admin', 'admin'],
  'reports:export': ['super-admin', 'admin', 'teacher'],
  'parent-portal:access': ['parent'],
  'whiteboard:access': ['super-admin', 'admin', 'teacher', 'student'],
  'avatar:start': ['student'],
  'gamification:view': ['super-admin', 'admin', 'teacher', 'student'],
};

// Middleware: require specific role(s)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

// Middleware: require specific permission
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      return res.status(403).json({ error: `Unknown permission: ${permission}` });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

// Middleware: require at least one of the roles
export function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

// Check if a user can access another user's data (hierarchy check)
export function canAccessRole(userRole, targetRole) {
  return ROLE_HIERARCHY[userRole]?.includes(targetRole) ?? false;
}

export { ROLE_HIERARCHY, PERMISSIONS };
