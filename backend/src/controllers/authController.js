const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, RefreshToken, PasswordResetToken } = require('../models');
const { sendApprovalEmail, sendPasswordResetEmail } = require('../services/emailService');
const { verifyRefreshToken } = require('../middleware/auth');

/**
 * توليد Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

/**
 * توليد وحفظ Refresh Token
 */
const generateAndSaveRefreshToken = async (userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
  return token;
};

/**
 * POST /api/auth/register
 * تسجيل طالب جديد
 */
exports.register = async (req, res) => {
  try {
    const { first_name, second_name, third_name, fourth_name, national_id, email, password } = req.body;

    // التحقق من عدم التكرار
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { national_id },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.national_id === national_id
          ? 'الرقم القومي مسجل مسبقاً'
          : 'البريد الإلكتروني مسجل مسبقاً',
      });
    }

    // تشفير كلمة السر
    const password_hash = await bcrypt.hash(password, 12);

    // معالجة صورة البطاقة
    let id_card_image_url = null;
    let id_card_public_id = null;
    if (req.file) {
      id_card_image_url = req.file.path;
      id_card_public_id = req.file.filename;
    }

    const user = await User.create({
      first_name,
      second_name,
      third_name,
      fourth_name,
      national_id,
      email: email || null,
      password_hash,
      id_card_image_url,
      id_card_public_id,
      role: 'student',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'تم استلام طلبك بنجاح. سيتم مراجعة بياناتك قريباً.',
      data: {
        id: user.id,
        full_name: `${user.first_name} ${user.second_name} ${user.third_name} ${user.fourth_name}`,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التسجيل' });
  }
};

/**
 * POST /api/auth/login
 * تسجيل الدخول بالإيميل أو الرقم القومي
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // البحث بالإيميل أو الرقم القومي
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { national_id: identifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // التحقق من كلمة السر
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // التحقق من حالة الحساب
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'حسابك قيد المراجعة، سنتواصل معك قريباً', code: 'PENDING' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'تم رفض طلبك. يُرجى التواصل مع الدعم', code: 'REJECTED' });
    }

    // توليد Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndSaveRefreshToken(user.id);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          full_name: `${user.first_name} ${user.second_name} ${user.third_name} ${user.fourth_name}`,
          email: user.email,
          national_id: user.national_id,
          role: user.role,
          status: user.status,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
};

/**
 * POST /api/auth/refresh
 * تجديد Access Token
 */
exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'refresh token مطلوب' });
    }

    const decoded = await verifyRefreshToken(refresh_token);
    const user = await User.findByPk(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'المستخدم غير متاح' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateAndSaveRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'refresh token غير صالح أو منتهي الصلاحية' });
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await RefreshToken.update({ revoked: true }, { where: { token: refresh_token } });
    }
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // دائماً نعيد نفس الرسالة لأمان أعلى
    if (!user || user.role !== 'student') {
      return res.json({ success: true, message: 'إذا كان الإيميل مسجلاً، ستصل رسالة على بريدك الإلكتروني' });
    }

    // حذف الرموز القديمة
    await PasswordResetToken.destroy({ where: { user_id: user.id } });

    // توليد رمز جديد
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 دقيقة

    await PasswordResetToken.create({ user_id: user.id, token, expires_at: expiresAt });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const fullName = `${user.first_name} ${user.second_name}`;

    await sendPasswordResetEmail(email, fullName, resetUrl);

    res.json({ success: true, message: 'إذا كان الإيميل مسجلاً، ستصل رسالة على بريدك الإلكتروني' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ، حاول مجدداً' });
  }
};

/**
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    const resetToken = await PasswordResetToken.findOne({
      where: { token, used: false },
      include: [{ model: require('../models').User, as: 'user' }],
    });

    if (!resetToken || new Date() > resetToken.expires_at) {
      return res.status(400).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    await resetToken.user.update({ password_hash });
    await resetToken.update({ used: true });

    // إلغاء كل refresh tokens
    await RefreshToken.update({ revoked: true }, { where: { user_id: resetToken.user_id } });

    res.json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      full_name: `${req.user.first_name} ${req.user.second_name} ${req.user.third_name} ${req.user.fourth_name}`,
      first_name: req.user.first_name,
      email: req.user.email,
      national_id: req.user.national_id,
      role: req.user.role,
      status: req.user.status,
    },
  });
};
