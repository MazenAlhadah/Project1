'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getUser } from '@/lib/auth';
import { authAPI } from '@/lib/api';

interface NavItem { href: string; label: string; icon: string; }

interface SidebarProps {
  navItems: NavItem[];
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ navItems, role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const roleLabel = role === 'admin' ? 'أدمن' : role === 'employee' ? 'موظف' : 'طالب';

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    try { await authAPI.logout(refreshToken); } catch {}
    clearAuth();
    router.replace('/login');
  };

  return (
    <>
      {isOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, backdropFilter: 'blur(2px)' }} onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>🎓 معادلات الهندسة</h2>
          <p>{roleLabel}</p>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`} onClick={onClose}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name || 'المستخدم'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-400)' }}>{user?.email || user?.national_id}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm btn-full">
            🚪 تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
