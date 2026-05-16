const rateLimit = require('express-rate-limit');

// Rate limiter عام للـ API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تجاوزت عدد الطلبات المسموح بها، حاول مجدداً بعد 15 دقيقة' },
});

// Rate limiter لتسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات تسجيل دخول كثيرة، حاول مجدداً بعد 15 دقيقة' },
  skipSuccessfulRequests: true,
});

// Rate limiter للتسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تجاوزت الحد المسموح للتسجيل، حاول بعد ساعة' },
});

// Rate limiter لاسترجاع كلمة السر
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'تجاوزت الحد المسموح، حاول مجدداً بعد ساعة' },
});

module.exports = { apiLimiter, loginLimiter, registerLimiter, forgotPasswordLimiter };
