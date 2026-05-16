'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';
import Sidebar from './Sidebar';
import '@/app/globals.css';

interface DashboardLayoutProps {
  children: ReactNode;
  requiredRole: string | string[];
  navItems: { href: string; label: string; icon: string }[];
}

export default function DashboardLayout({ children, requiredRole, navItems }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || !isAuthenticated()) { router.replace('/login'); return; }
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) { router.replace('/login'); return; }
    setReady(true);
  }, []);

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  const user = getUser();
  const role = user?.role || '';

  return (
    <div className="dashboard">
      <Sidebar navItems={navItems} role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <div className="topbar" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button className="btn btn-secondary btn-sm" style={{ display: 'none' }} onClick={() => setSidebarOpen(true)} id="menu-toggle">
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div className="topbar-right">
            <div className="user-avatar">{user?.first_name?.[0] || '؟'}</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{user?.full_name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-400)' }}>{role === 'admin' ? 'أدمن' : role === 'employee' ? 'موظف' : 'طالب'}</p>
            </div>
          </div>
        </div>
        <div className="animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}
