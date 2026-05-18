// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import db from '@/lib/db/models';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import { checkAuth, getAuthUser } from '@/lib/auth-helper';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { User, RefreshToken, PasswordResetToken } = db;

const generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateAndSaveRefreshToken = async (userId: string) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
  return token;
};

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const action = params.action;

  try {
    if (action === 'register') {
      const formData = await req.formData();
      const national_id = formData.get('national_id') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { national_id },
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: existingUser.national_id === national_id
            ? 'الرقم القومي مسجل مسبقاً'
            : 'البريد الإلكتروني مسجل مسبقاً',
        }, { status: 409 });
      }

      const password_hash = await bcrypt.hash(password, 12);
      let id_card_image_url = null;
      let id_card_public_id = null;
      
      const file = formData.get('id_card_image') as File;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'id_cards' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(buffer);
        }) as any;
        id_card_image_url = uploadResult.secure_url;
        id_card_public_id = uploadResult.public_id;
      }

      const user = await User.create({
        first_name: formData.get('first_name'),
        second_name: formData.get('second_name'),
        third_name: formData.get('third_name'),
        fourth_name: formData.get('fourth_name'),
        national_id,
        email: email || null,
        password_hash,
        id_card_image_url,
        id_card_public_id,
        role: 'student',
        status: 'pending',
      });

      return NextResponse.json({
        success: true,
        message: 'تم استلام طلبك بنجاح. سيتم مراجعة بياناتك قريباً.',
        data: { id: user.id, status: user.status },
      }, { status: 201 });
    }

    if (action === 'login') {
      const { identifier, password } = await req.json();
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: identifier }, { national_id: identifier }],
        },
      });

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 });
      }

      if (user.status === 'pending') {
        return NextResponse.json({ success: false, message: 'حسابك قيد المراجعة', code: 'PENDING' }, { status: 403 });
      }
      if (user.status === 'rejected') {
        return NextResponse.json({ success: false, message: 'تم رفض طلبك', code: 'REJECTED' }, { status: 403 });
      }

      const access_token = generateAccessToken(user);
      const refresh_token = await generateAndSaveRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: {
          user: {
            id: user.id, full_name: `${user.first_name} ${user.second_name}`, role: user.role, status: user.status
          },
          access_token, refresh_token
        },
      });
    }

    if (action === 'refresh') {
      const { refresh_token } = await req.json();
      if (!refresh_token) return NextResponse.json({ success: false }, { status: 400 });
      
      const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!) as any;
      const user = await User.findByPk(decoded.id);
      if (!user || user.status !== 'active') return NextResponse.json({ success: false }, { status: 401 });

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = await generateAndSaveRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        data: { access_token: newAccessToken, refresh_token: newRefreshToken },
      });
    }

    if (action === 'logout') {
      const { refresh_token } = await req.json();
      if (refresh_token) {
        await RefreshToken.update({ revoked: true }, { where: { token: refresh_token } });
      }
      return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    }
    
    if (action === 'forgot-password') {
      const { email } = await req.json();
      const user = await User.findOne({ where: { email } });
      if (!user || user.role !== 'student') return NextResponse.json({ success: true });
      const token = crypto.randomBytes(32).toString('hex');
      await PasswordResetToken.create({ user_id: user.id, token, expires_at: new Date(Date.now() + 30 * 60 * 1000) });
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, `${user.first_name} ${user.second_name}`, resetUrl);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'reset-password') {
      const { token, new_password } = await req.json();
      const resetToken = await PasswordResetToken.findOne({ where: { token, used: false }, include: [{ model: User, as: 'user' }] });
      if (!resetToken || new Date() > resetToken.expires_at) return NextResponse.json({ success: false }, { status: 400 });
      const password_hash = await bcrypt.hash(new_password, 12);
      await resetToken.user.update({ password_hash });
      await resetToken.update({ used: true });
      await RefreshToken.update({ revoked: true }, { where: { user_id: resetToken.user_id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { action: string } }) {
  if (params.action === 'me') {
    const auth = checkAuth(req);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    
    const user = await User.findByPk(auth.user!.id);
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        full_name: `${user.first_name} ${user.second_name} ${user.third_name} ${user.fourth_name}`,
        first_name: user.first_name,
        email: user.email,
        national_id: user.national_id,
        role: user.role,
        status: user.status,
      },
    });
  }
  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}
