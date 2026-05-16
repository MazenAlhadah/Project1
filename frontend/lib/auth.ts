'use client';

export interface User {
  id: string;
  full_name: string;
  first_name: string;
  email: string;
  national_id: string;
  role: 'student' | 'employee' | 'admin';
  status: 'pending' | 'active' | 'rejected';
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

export const setAuth = (user: User, accessToken: string, refreshToken: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!(localStorage.getItem('access_token') && localStorage.getItem('user'));
};

export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'admin': return '/admin/join-requests';
    case 'employee': return '/employee/join-requests';
    default: return '/student/books';
  }
};
