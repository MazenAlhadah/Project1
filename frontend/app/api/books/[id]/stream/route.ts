import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db/models';
import { generateSignedUrl } from '@/lib/cloudinary';

const { Book, Purchase } = db;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return new NextResponse('Unauthorized', { status: 401 });

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    } catch {
      return new NextResponse('Invalid Token', { status: 401 });
    }
    
    if (decoded.role === 'student') {
      const purchase = await Purchase.findOne({
        where: { user_id: decoded.id, book_id: params.id, status: 'confirmed' },
      });
      if (!purchase) return new NextResponse('Forbidden: Purchase not confirmed', { status: 403 });
    }

    const book = await Book.findByPk(params.id);
    if (!book || !book.file_public_id) return new NextResponse('Book not found', { status: 404 });

    const signedUrl = generateSignedUrl(book.file_public_id);
    const fetchRes = await fetch(signedUrl);

    if (!fetchRes.ok) return new NextResponse('Failed to fetch from Cloudinary', { status: 502 });

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline; filename="book.pdf"');
    headers.set('Cache-Control', 'no-cache');
    if (fetchRes.headers.has('content-length')) headers.set('Content-Length', fetchRes.headers.get('content-length')!);
    if (fetchRes.headers.has('accept-ranges')) headers.set('Accept-Ranges', fetchRes.headers.get('accept-ranges')!);

    return new NextResponse(fetchRes.body, { status: 200, headers });
  } catch (error) {
    console.error('Stream error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
