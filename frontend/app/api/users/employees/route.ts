// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/models';
import { Op } from 'sequelize';
const { User } = db;

export async function GET(req: NextRequest) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const employees = await User.findAll({ where: { role: 'employee' }, attributes: { exclude: ['password_hash'] } });
    return NextResponse.json({ success: true, data: employees });
  } catch(e) { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req, ['admin']);
  if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  try {
    const { first_name, second_name, third_name, fourth_name, national_id, email, password } = await req.json();
    const nId = national_id || null;
    const eMail = email || null;
    
    const orConditions = [];
    if (nId) orConditions.push({ national_id: nId });
    if (eMail) orConditions.push({ email: eMail });
    
    if (orConditions.length > 0) {
      const existing = await User.findOne({ where: { [Op.or]: orConditions } });
      if (existing) return NextResponse.json({ success: false, message: 'موجود مسبقاً' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const emp = await User.create({ 
      first_name, 
      second_name, 
      third_name: third_name || '-', 
      fourth_name: fourth_name || '-', 
      national_id: nId, 
      email: eMail, 
      password_hash, 
      role: 'employee', 
      status: 'active' 
    });
    return NextResponse.json({ success: true, message: 'تمت الإضافة', data: emp }, { status: 201 });
  } catch(e) { return NextResponse.json({ success: false }, { status: 500 }); }
}
