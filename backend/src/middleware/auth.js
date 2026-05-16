const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');

/**
 * Middleware للتحقق من JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'لم يتم توفير رمز المصادقة' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'حسابك غير مفعل' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة، سجل دخولك مجدداً', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'رمز مصادقة غير صالح' });
  }
};

/**
 * التحقق من refresh token وإصدار access token جديد
 */
const verifyRefreshToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const storedToken = await RefreshToken.findOne({
    where: { token: refreshToken, revoked: false },
  });

  if (!storedToken || new Date() > storedToken.expires_at) {
    throw new Error('Refresh token غير صالح أو منتهي');
  }

  // Token Rotation: إلغاء القديم وإصدار جديد
  await storedToken.update({ revoked: true });

  return decoded;
};

module.exports = { authenticate, verifyRefreshToken };
