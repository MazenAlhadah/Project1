// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import db from '@/lib/db/models';
const { Settings } = db;

export async function GET(req: NextRequest) {
  try {
    const settings = await Settings.findOne();
    return NextResponse.json({ success: true, data: settings || {} });
  } catch(e) {
    console.error('Settings GET error:', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    let settings = await Settings.findOne();
    if (settings) {
      await settings.update(body);
    } else {
      settings = await Settings.create(body);
    }
    return NextResponse.json({ success: true, message: 'تم تحديث الإعدادات', data: settings });
  } catch(e) {
    console.error('Settings PUT error:', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
