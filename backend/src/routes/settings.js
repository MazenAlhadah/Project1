const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireEmployee, requireAdmin } = require('../middleware/roleCheck');

router.get('/', authenticate, requireEmployee, settingsController.getSettings);
router.put('/', authenticate, requireAdmin, settingsController.updateSettings);

module.exports = router;
