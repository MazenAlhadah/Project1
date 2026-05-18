// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';

const { Purchase, Book } = db;

export async function GET(req: NextRequest) {
  const auth = checkAuth(req, ['student']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const purchases = await Purchase.findAll({
      where: { user_id: auth.user!.id },
      include: [{ model: Book, as: 'book', attributes: ['title', 'cover_image_url'] }],
      order: [['requested_at', 'DESC']],
    });
    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
