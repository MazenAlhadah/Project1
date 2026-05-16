/**
 * Middleware للتحقق من الأدوار
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصادق' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'لا تملك صلاحية الوصول لهذا المورد',
      });
    }

    next();
  };
};

// Shortcuts للأدوار الشائعة
const requireStudent = requireRole('student');
const requireEmployee = requireRole('employee', 'admin');
const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireStudent, requireEmployee, requireAdmin };
