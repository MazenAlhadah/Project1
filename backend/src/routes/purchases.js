const router = require('express').Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roleCheck');

router.post('/', authenticate, purchaseController.requestPurchase);
router.get('/my', authenticate, purchaseController.getMyPurchases);
router.get('/pending', authenticate, requireEmployee, purchaseController.getPendingPurchases);
router.get('/all', authenticate, requireEmployee, purchaseController.getAllPurchases);
router.put('/:id/confirm', authenticate, requireEmployee, purchaseController.confirmPurchase);
router.put('/:id/reject', authenticate, requireEmployee, purchaseController.rejectPurchase);

module.exports = router;
