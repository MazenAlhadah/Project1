// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
import { cloudinary } from '@/lib/cloudinary';

const { Book, Purchase } = db;

export async function GET(req: NextRequest) {
  try {
    const books = await Book.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'description', 'price', 'cover_image_url', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    const auth = checkAuth(req);
    let booksWithPurchase = books;

    if (!auth.error && auth.user?.role === 'student') {
      const purchases = await Purchase.findAll({
        where: { user_id: auth.user.id, status: 'confirmed' },
        attributes: ['book_id'],
      });
      const purchasedBookIds = purchases.map((p: any) => p.book_id);
      booksWithPurchase = books.map((book: any) => ({
        ...book.toJSON(),
        is_purchased: purchasedBookIds.includes(book.id),
      }));
    }

    return NextResponse.json({ success: true, data: booksWithPurchase });
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في جلب الكتب' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;

    let cover_image_url = null;
    let cover_image_public_id = null;
    let file_url = null;
    let file_public_id = null;

    const coverFile = formData.get('cover_image') as File;
    if (coverFile) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/books/covers', resource_type: 'image' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      cover_image_url = coverResult.secure_url;
      cover_image_public_id = coverResult.public_id;
    }

    const bookFile = formData.get('book_file') as File;
    if (bookFile) {
      const buffer = Buffer.from(await bookFile.arrayBuffer());
      const fileResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/books/files', resource_type: 'raw', type: 'authenticated' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      file_url = fileResult.secure_url;
      file_public_id = fileResult.public_id;
    }

    const book = await Book.create({
      title,
      description,
      price: parseFloat(price),
      cover_image_url,
      cover_image_public_id,
      file_url,
      file_public_id,
    });

    return NextResponse.json({ success: true, message: 'تم إضافة الكتاب بنجاح', data: book }, { status: 201 });
  } catch (error) {
    console.error('Create book error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في إضافة الكتاب' }, { status: 500 });
  }
}
