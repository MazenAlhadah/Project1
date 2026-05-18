// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';

const { Purchase } = db;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const purchase = await Purchase.findByPk(params.id);
    if (!purchase) return NextResponse.json({ success: false, message: 'الطلب غير موجود' }, { status: 404 });
    if (purchase.status !== 'pending') return NextResponse.json({ success: false, message: 'الطلب لم يعد قيد الانتظار' }, { status: 400 });

    await purchase.update({ status: 'rejected', confirmed_by: auth.user!.id, confirmed_at: new Date() });
    return NextResponse.json({ success: true, message: 'تم رفض الطلب' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
