// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
import { cloudinary, deleteFile } from '@/lib/cloudinary';

const { Book } = db;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const book = await Book.findByPk(params.id);
    if (!book) return NextResponse.json({ success: false, message: 'الكتاب غير موجود' }, { status: 404 });

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const is_active = formData.get('is_active') as string;

    let updateData: any = {};
    if (title) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (price !== null) updateData.price = parseFloat(price);
    if (is_active !== null) updateData.is_active = is_active === 'true';

    const coverFile = formData.get('cover_image') as File;
    if (coverFile) {
      if (book.cover_image_public_id) await deleteFile(book.cover_image_public_id, 'image').catch(() => {});
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/books/covers', resource_type: 'image' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      updateData.cover_image_url = coverResult.secure_url;
      updateData.cover_image_public_id = coverResult.public_id;
    }

    const bookFile = formData.get('book_file') as File;
    if (bookFile) {
      if (book.file_public_id) await deleteFile(book.file_public_id, 'raw').catch(() => {});
      const buffer = Buffer.from(await bookFile.arrayBuffer());
      const fileResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/books/files', resource_type: 'raw', type: 'authenticated' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      updateData.file_url = fileResult.secure_url;
      updateData.file_public_id = fileResult.public_id;
    }

    await book.update(updateData);
    return NextResponse.json({ success: true, message: 'تم تحديث الكتاب بنجاح', data: book });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ في تحديث الكتاب' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['employee', 'admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const book = await Book.findByPk(params.id);
    if (!book) return NextResponse.json({ success: false, message: 'الكتاب غير موجود' }, { status: 404 });

    if (book.cover_image_public_id) await deleteFile(book.cover_image_public_id, 'image').catch(() => {});
    if (book.file_public_id) await deleteFile(book.file_public_id, 'raw').catch(() => {});

    await book.destroy();
    return NextResponse.json({ success: true, message: 'تم حذف الكتاب بنجاح' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ في حذف الكتاب' }, { status: 500 });
  }
}
