'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { usersAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { href: '/admin/join-requests', label: 'طلبات الانضمام', icon: '📋' },
  { href: '/admin/payment-confirmations', label: 'تفعيل الكتب للطلاب', icon: '💳' },
  { href: '/admin/courses', label: 'إدارة الكورسات', icon: '🎓' },
  { href: '/admin/books', label: 'إدارة الكتب', icon: '📚' },
  { href: '/admin/users', label: 'بيانات الطلاب', icon: '👥' },
  { href: '/admin/employees', label: 'إدارة الموظفين', icon: '👔' },
  { href: '/admin/admins', label: 'إدارة الأدمنز', icon: '🛡️' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', second_name: '', email: '', password: '' });
  const me = getUser();

  const load = () => usersAPI.getAdmins().then(r => setAdmins(r.data.data || [])).catch(() => toast.error('خطأ')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.first_name || !form.email || !form.password) return toast.error('جميع الحقول مطلوبة');
    setSaving(true);
    try {
      await usersAPI.createAdmin({ ...form, third_name: '-', fourth_name: '-' });
      toast.success('تم إضافة الأدمن ✅'); setShowModal(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (id === me?.id) return toast.error('لا يمكنك حذف حسابك الخاص');
    if (!confirm('حذف هذا الأدمن؟')) return;
    try { await usersAPI.deleteAdmin(id); toast.success('تم الحذف'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🛡️ إضافة أدمن جديد</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label className="form-label">الاسم الأول *</label><input className="form-input" value={form.first_name} onChange={e => setForm(p=>({...p,first_name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">الاسم الثاني *</label><input className="form-input" value={form.second_name} onChange={e => setForm(p=>({...p,second_name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">البريد الإلكتروني *</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">كلمة السر *</label><input type="password" className="form-input" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="spinner" style={{width:16,height:16}}/> جاري...</> : '💾 إضافة'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1 className="page-title">إدارة الأدمنز</h1></div>
        <button className="btn btn-primary" onClick={() => { setForm({ first_name:'', second_name:'', email:'', password:'' }); setShowModal(true); }}>➕ إضافة أدمن</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>تاريخ الإضافة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={a.id}>
                  <td>{i+1}</td>
                  <td style={{ fontWeight: 600 }}>
                    {a.first_name} {a.second_name}
                    {a.id === me?.id && <span className="badge badge-active" style={{ marginRight: 8, fontSize: 11 }}>أنت</span>}
                  </td>
                  <td>{a.email}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-400)' }}>{new Date(a.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    {a.id !== me?.id ? (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑️ حذف</button>
                    ) : <span style={{ fontSize: 13, color: 'var(--text-400)' }}>—</span>}
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
