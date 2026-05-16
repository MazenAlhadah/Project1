'use client';
// Admin versions of employee pages - reuse same logic with admin nav
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { href: '/admin/join-requests', label: 'طلبات الانضمام', icon: '📋' },
  { href: '/admin/payment-confirmations', label: 'تأكيد المدفوعات', icon: '💳' },
  { href: '/admin/books', label: 'إدارة الكتب', icon: '📚' },
  { href: '/admin/users', label: 'بيانات الطلاب', icon: '👥' },
  { href: '/admin/employees', label: 'إدارة الموظفين', icon: '👔' },
  { href: '/admin/admins', label: 'إدارة الأدمنز', icon: '🛡️' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const load = () => usersAPI.getPending().then(r => setRequests(r.data.data || [])).catch(() => toast.error('خطأ في التحميل')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try { await usersAPI.approve(id); toast.success('تم قبول الطالب ✅'); setRequests(p => p.filter(r => r.id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('رفض هذا الطالب؟')) return;
    setProcessing(id);
    try { await usersAPI.reject(id); toast.success('تم الرفض'); setRequests(p => p.filter(r => r.id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setProcessing(null); }
  };

  const fullName = (u: any) => `${u.first_name} ${u.second_name} ${u.third_name} ${u.fourth_name}`;

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      {viewImage && (
        <div className="modal-overlay" onClick={() => setViewImage(null)}>
          <div style={{ maxWidth: 700, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewImage(null)} style={{ position: 'absolute', top: -40, left: 0, background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer' }}>✕</button>
            <img src={viewImage} alt="بطاقة الهوية" style={{ width: '100%', borderRadius: 12 }} />
          </div>
        </div>
      )}
      <div className="page-header"><h1 className="page-title">طلبات الانضمام</h1><p className="page-subtitle">مراجعة وقبول أو رفض طلبات الطلاب الجدد</p></div>
      <div className="card" style={{ marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 32 }}>📋</span><div><p style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{requests.length}</p><p style={{ fontSize: 13, color: 'var(--text-400)' }}>طلب انتظار</p></div></div></div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : requests.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🎉</div><h3>لا توجد طلبات معلقة</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>الاسم الرباعي</th><th>الرقم القومي</th><th>البطاقة</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {requests.map((req, i) => (
                <tr key={req.id}>
                  <td>{i+1}</td>
                  <td style={{ fontWeight: 600 }}>{fullName(req)}</td>
                  <td dir="ltr" style={{ fontFamily: 'monospace' }}>{req.national_id}</td>
                  <td>{req.id_card_image_url ? <button className="btn btn-secondary btn-sm" onClick={() => setViewImage(req.id_card_image_url)}>👁️ عرض</button> : <span style={{ color: 'var(--text-400)', fontSize: 13 }}>لا يوجد</span>}</td>
                  <td style={{ color: 'var(--text-400)', fontSize: 13 }}>{new Date(req.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(req.id)} disabled={processing === req.id}>{processing === req.id ? <span className="spinner" style={{width:14,height:14}}/> : '✅ قبول'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(req.id)} disabled={processing === req.id}>❌ رفض</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
