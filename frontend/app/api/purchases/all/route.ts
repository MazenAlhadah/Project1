// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';

const { Purchase, Book, User } = db;

export async function GET(req: NextRequest) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const purchases = await Purchase.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['first_name', 'second_name', 'national_id'] },
        { model: Book, as: 'book', attributes: ['title', 'price'] },
        { model: User, as: 'confirmedBy', attributes: ['first_name', 'second_name'] },
      ],
      order: [['requested_at', 'DESC']],
    });
    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
