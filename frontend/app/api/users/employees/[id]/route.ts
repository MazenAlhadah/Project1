// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/models';
const { User } = db;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const emp = await User.findByPk(params.id);
    if (!emp) return NextResponse.json({ success: false }, { status: 404 });
    const body = await req.json();
    if (body.password) body.password_hash = await bcrypt.hash(body.password, 12);
    await emp.update(body);
    return NextResponse.json({ success: true, message: 'تم التحديث' });
  } catch(e) { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const emp = await User.findByPk(params.id);
    if (emp) await emp.destroy();
    return NextResponse.json({ success: true, message: 'تم الحذف' });
  } catch(e) { return NextResponse.json({ success: false }, { status: 500 }); }
}
