const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireEmployee, requireAdmin } = require('../middleware/roleCheck');

// Students
router.get('/', authenticate, requireEmployee, userController.getStudents);
router.get('/pending', authenticate, requireEmployee, userController.getPendingStudents);
router.put('/:id/approve', authenticate, requireEmployee, userController.approveStudent);
router.put('/:id/reject', authenticate, requireEmployee, userController.rejectStudent);
router.put('/:id/reset-password', authenticate, requireEmployee, userController.resetStudentPassword);
router.delete('/:id', authenticate, requireEmployee, userController.deleteStudent);
router.put('/:id/reactivate', authenticate, requireEmployee, userController.reactivateStudent);

// Employees (admin only)
router.get('/employees', authenticate, requireAdmin, userController.getEmployees);
router.post('/employees', authenticate, requireAdmin, userController.createEmployee);
router.put('/employees/:id', authenticate, requireAdmin, userController.updateEmployee);
router.delete('/employees/:id', authenticate, requireAdmin, userController.deleteEmployee);

// Admins (admin only)
router.get('/admins', authenticate, requireAdmin, userController.getAdmins);
router.post('/admins', authenticate, requireAdmin, userController.createAdmin);
router.delete('/admins/:id', authenticate, requireAdmin, userController.deleteAdmin);

module.exports = router;
