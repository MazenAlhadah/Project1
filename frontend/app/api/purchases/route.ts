// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';

const { Purchase } = db;

export async function POST(req: NextRequest) {
  const auth = checkAuth(req, ['student']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const { book_id } = await req.json();
    const existing = await Purchase.findOne({ where: { user_id: auth.user!.id, book_id } });
    if (existing) {
      if (existing.status === 'pending') return NextResponse.json({ success: false, message: 'لديك طلب قيد الانتظار لهذا الكتاب' }, { status: 400 });
      if (existing.status === 'confirmed') return NextResponse.json({ success: false, message: 'لقد قمت بشراء هذا الكتاب مسبقاً' }, { status: 400 });
    }

    await Purchase.create({ user_id: auth.user!.id, book_id, status: 'pending' });
    return NextResponse.json({ success: true, message: 'تم استلام طلب الشراء، في انتظار التأكيد' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
