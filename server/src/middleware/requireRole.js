// server/src/middleware/requireRole.js

/**
 * requireRole("admin")
 * - Assumes requireAuth already ran and set req.user = { id, role }
 * - Blocks access if role mismatch
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return function roleGuard(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: insufficient permissions"
      });
    }

    return next();
  };
}

module.exports = { requireRole };
