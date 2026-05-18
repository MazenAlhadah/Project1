// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/models';
import { sendApprovalEmail } from '@/lib/services/emailService';
const { User } = db;

export async function PUT(req: NextRequest, { params }: { params: { id: string, action: string } }) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const user = await User.findByPk(params.id);
    if (!user) return NextResponse.json({ success: false, message: 'المستخدم غير موجود' }, { status: 404 });
    const action = params.action;

    if (action === 'approve') {
      await user.update({ status: 'active' });
      await sendApprovalEmail(user.email, user.first_name + ' ' + user.second_name).catch(console.error);
      return NextResponse.json({ success: true, message: 'تم قبول الطالب بنجاح' });
    }
    if (action === 'reject') {
      await user.update({ status: 'rejected' });
      return NextResponse.json({ success: true, message: 'تم رفض الطالب' });
    }
    if (action === 'reactivate') {
      await user.update({ status: 'active' });
      return NextResponse.json({ success: true, message: 'تم إعادة تفعيل الحساب' });
    }
    if (action === 'reset-password') {
      if (auth.user?.role !== 'admin') return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 });
      const password_hash = await bcrypt.hash('12345678', 12);
      await user.update({ password_hash });
      return NextResponse.json({ success: true, message: 'تم إعادة تعيين كلمة السر إلى 12345678' });
    }
    return NextResponse.json({ success: false }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, action: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const user = await User.findByPk(params.id);
    if (user && params.action === 'delete') {
       await user.destroy();
       return NextResponse.json({ success: true, message: 'تم حذف المستخدم' });
    }
    return NextResponse.json({ success: false }, { status: 404 });
  } catch(e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
