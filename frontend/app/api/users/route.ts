// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
import { Op } from 'sequelize';
const { User } = db;

export async function GET(req: NextRequest) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const students = await User.findAll({
      where: { role: 'student', status: { [Op.ne]: 'pending' } },
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
