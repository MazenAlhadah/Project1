// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
import { cloudinary } from '@/lib/cloudinary';

const { Course } = db;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const course = await Course.findByPk(params.id);
    if (!course) return NextResponse.json({ success: false, message: 'الكورس غير موجود' }, { status: 404 });

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'true';
    const coming_soon = formData.get('coming_soon') === 'true';

    let cover_image_url = course.cover_image_url;
    let cover_image_public_id = course.cover_image_public_id;

    const coverFile = formData.get('cover_image') as File;
    if (coverFile) {
      if (course.cover_image_public_id) {
        await cloudinary.uploader.destroy(course.cover_image_public_id).catch(console.error);
      }
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/courses/covers', resource_type: 'image' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      cover_image_url = coverResult.secure_url;
      cover_image_public_id = coverResult.public_id;
    }

    await course.update({
      title,
      description,
      is_active,
      coming_soon,
      cover_image_url,
      cover_image_public_id,
    });

    return NextResponse.json({ success: true, message: 'تم تحديث الكورس', data: course });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const course = await Course.findByPk(params.id);
    if (!course) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 });

    if (course.cover_image_public_id) {
      await cloudinary.uploader.destroy(course.cover_image_public_id).catch(console.error);
    }
    await course.destroy();

    return NextResponse.json({ success: true, message: 'تم الحذف' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
