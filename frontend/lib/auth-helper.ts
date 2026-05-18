import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthUser {
  id: string;
  role: string;
  status: string;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function checkAuth(request: NextRequest, allowedRoles?: string[]) {
  const user = getAuthUser(request);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  // تمت إزالة التحقق من الحالة من التوكن نفسه لأن التوكن قد يكون قديماً (Pending) بينما الطالب تم قبوله في الداتا بيز (Active).
  // if (user.status !== 'active' && user.role !== 'admin') {
  //   return { error: 'Account not active', status: 403 };
  // }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }
  return { user };
}
