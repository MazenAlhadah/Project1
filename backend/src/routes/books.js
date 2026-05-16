const router = require('express').Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roleCheck');
const { uploadBookWithCover } = require('../middleware/upload');

// عام - قائمة الكتب (مع optional auth لمعرفة الكتب المشتراة)
router.get('/', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) return authenticate(req, res, next);
  next();
}, bookController.getBooks);

// كل الكتب (للموظف/أدمن)
router.get('/all', authenticate, requireEmployee, bookController.getAllBooks);

// قراءة كتاب (طالب اشترى)
router.get('/:id/read', authenticate, bookController.getReadUrl);

// إضافة كتاب
router.post('/', authenticate, requireEmployee, uploadBookWithCover, bookController.createBook);

// تعديل كتاب
router.put('/:id', authenticate, requireEmployee, uploadBookWithCover, bookController.updateBook);

// حذف كتاب
router.delete('/:id', authenticate, requireEmployee, bookController.deleteBook);

module.exports = router;
