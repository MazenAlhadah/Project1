const router = require('express').Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roleCheck');
const { uploadCoverImage } = require('../middleware/upload');

router.get('/', courseController.getCourses);
router.post('/', authenticate, requireEmployee, uploadCoverImage, courseController.createCourse);

module.exports = router;
