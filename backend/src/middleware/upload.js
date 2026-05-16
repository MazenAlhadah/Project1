const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Storage للصور العامة (صور الغلاف، بطاقات الهوية)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'engineering-platform/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// Storage للكتب (PDF - خاص - authenticated)
const bookStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'engineering-platform/books',
    resource_type: 'raw',
    type: 'authenticated', // ملف خاص لا يُفتح بدون signed URL
    allowed_formats: ['pdf'],
  },
});

// Storage لبطاقات الهوية
const idCardStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'engineering-platform/id-cards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    type: 'authenticated', // خاص
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer instances
const uploadIdCard = multer({
  storage: idCardStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'application/pdf']),
}).single('id_card');

const uploadCoverImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('cover_image');

const uploadBookFile = multer({
  storage: bookStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: fileFilter(['application/pdf']),
}).single('book_file');

const uploadBookWithCover = multer({
  storage: multer.memoryStorage(), // نحتاج رفع ملفين
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'book_file', maxCount: 1 },
]);

// Error handler للـ multer
const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'حجم الملف يتجاوز الحد المسموح' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadIdCard: handleUploadError(uploadIdCard),
  uploadCoverImage: handleUploadError(uploadCoverImage),
  uploadBookFile: handleUploadError(uploadBookFile),
  uploadBookWithCover: handleUploadError(uploadBookWithCover),
};
