// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/models';
import { checkAuth } from '@/lib/auth-helper';
import { cloudinary } from '@/lib/cloudinary';

const { Course } = db;

export async function GET(req: NextRequest) {
  try {
    const courses = await Course.findAll({ order: [['created_at', 'DESC']] });
    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'true';
    const coming_soon = formData.get('coming_soon') === 'true';

    let cover_image_url = null;
    let cover_image_public_id = null;

    const coverFile = formData.get('cover_image') as File;
    if (coverFile) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'engineering-platform/courses/covers', resource_type: 'image' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        }).end(buffer);
      }) as any;
      cover_image_url = coverResult.secure_url;
      cover_image_public_id = coverResult.public_id;
    }

    const course = await Course.create({
      title,
      description,
      cover_image_url,
      cover_image_public_id,
      is_active,
      coming_soon,
    });

    return NextResponse.json({ success: true, message: 'تم إضافة الكورس بنجاح', data: course }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في إضافة الكورس' }, { status: 500 });
  }
}
