// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
import { generateSignedUrl } from '@/lib/cloudinary';

const { Book, Purchase } = db;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    if (auth.user?.role === 'student') {
      const purchase = await Purchase.findOne({
        where: { user_id: auth.user.id, book_id: params.id, status: 'confirmed' },
      });
      if (!purchase) {
        return NextResponse.json({ success: false, message: 'لم تقم بشراء هذا الكتاب أو لم يتم تأكيد الدفع' }, { status: 403 });
      }
    }

    const book = await Book.findByPk(params.id, { attributes: ['id', 'title', 'file_public_id'] });
    if (!book || !book.file_public_id) {
      return NextResponse.json({ success: false, message: 'الكتاب غير متاح حالياً' }, { status: 404 });
    }

    const signedUrl = generateSignedUrl(book.file_public_id);
    return NextResponse.json({
      success: true,
      data: { title: book.title, url: signedUrl, expires_in: 900 },
    });
  } catch (error) {
    console.error('Get read URL error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
