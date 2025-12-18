/**
 * Role-Based Authorization Middleware
 * Checks if user has required role(s) to access a resource
 */

/**
 * Middleware factory to check user roles
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Convenience middleware for specific roles
const requireCustomer = requireRole('CUSTOMER');
const requireStaff = requireRole('STAFF');
const requireAdmin = requireRole('ADMIN');
const requireStaffOrAdmin = requireRole('STAFF', 'ADMIN');

module.exports = {
  requireRole,
  requireCustomer,
  requireStaff,
  requireAdmin,
  requireStaffOrAdmin
};
