// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
const { User } = db;

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const admin = await User.findByPk(params.id);
    if (admin) await admin.destroy();
    return NextResponse.json({ success: true, message: 'تم الحذف' });
  } catch(e) { return NextResponse.json({ success: false }, { status: 500 }); }
}
