'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { purchasesAPI } from '@/lib/api';
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

export default function AdminPaymentsPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = () => purchasesAPI.getPending().then(r => setPurchases(r.data.data || [])).catch(() => toast.error('خطأ')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleConfirm = async (id: string) => {
    setProcessing(id);
    try { await purchasesAPI.confirm(id); toast.success('تم تأكيد الدفع ✅'); setPurchases(p => p.filter(r => r.id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); } finally { setProcessing(null); }
  };
  const handleReject = async (id: string) => {
    if (!confirm('رفض طلب الشراء؟')) return;
    setProcessing(id);
    try { await purchasesAPI.reject(id); toast.success('تم الرفض'); setPurchases(p => p.filter(r => r.id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); } finally { setProcessing(null); }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      <div className="page-header"><h1 className="page-title">تأكيد المدفوعات</h1></div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : purchases.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✅</div><h3>لا توجد طلبات معلقة</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>اسم الطالب</th><th>الكتاب</th><th>السعر</th><th>تاريخ الطلب</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {purchases.map((p, i) => (
                <tr key={p.id}>
                  <td>{i+1}</td>
                  <td style={{ fontWeight: 600 }}>{p.buyer ? `${p.buyer.first_name} ${p.buyer.second_name}` : '—'}</td>
                  <td>{p.book?.title || '—'}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{p.book ? `${parseFloat(p.book.price).toFixed(0)} جنيه` : '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-400)' }}>{new Date(p.requested_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleConfirm(p.id)} disabled={processing === p.id}>{processing === p.id ? <span className="spinner" style={{width:14,height:14}}/> : '✅ تأكيد'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(p.id)} disabled={processing === p.id}>❌ رفض</button>
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
