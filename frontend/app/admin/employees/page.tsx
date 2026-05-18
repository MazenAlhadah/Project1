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

interface UserItem { id: string; first_name: string; second_name: string; email: string; created_at: string; }

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', second_name: '', third_name: '', fourth_name: '', email: '', password: '' });

  const load = () => usersAPI.getEmployees().then(r => setEmployees(r.data.data || [])).catch(() => toast.error('خطأ')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditEmp(null); setForm({ first_name:'', second_name:'', third_name:'', fourth_name:'', email:'', password:'' }); setShowModal(true); };
  const openEdit = (e: any) => { setEditEmp(e); setForm({ first_name: e.first_name, second_name: e.second_name, third_name: e.third_name||'', fourth_name: e.fourth_name||'', email: e.email, password: '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.first_name || !form.email) return toast.error('الاسم والإيميل مطلوبان');
    if (!editEmp && !form.password) return toast.error('كلمة السر مطلوبة');
    setSaving(true);
    try {
      if (editEmp) { await usersAPI.updateEmployee(editEmp.id, form); toast.success('تم التحديث'); }
      else { await usersAPI.createEmployee(form); toast.success('تم إضافة الموظف ✅'); }
      setShowModal(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الموظف؟')) return;
    try { await usersAPI.deleteEmployee(id); toast.success('تم الحذف'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editEmp ? '✏️ تعديل موظف' : '➕ إضافة موظف'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['first_name','second_name','third_name','fourth_name'].map((f,i) => (
                <div className="form-group" key={f} style={{ marginBottom: 0 }}>
                  <label className="form-label">{['الاسم الأول','الاسم الثاني','الاسم الثالث','الاسم الرابع'][i]} {i<2?'*':''}</label>
                  <input className="form-input" value={(form as any)[f]} onChange={e => setForm(p=>({...p,[f]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 12 }}><label className="form-label">البريد الإلكتروني *</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">كلمة السر {editEmp ? '(اتركها فارغة لعدم التغيير)' : '*'}</label><input type="password" className="form-input" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{width:16,height:16}}/> جاري الحفظ...</> : '💾 حفظ'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1 className="page-title">إدارة الموظفين</h1><p className="page-subtitle">إضافة وتعديل وحذف حسابات الموظفين</p></div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة موظف</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : employees.length === 0 ? <div className="empty-state"><div className="empty-state-icon">👔</div><h3>لا يوجد موظفين بعد</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>تاريخ الإضافة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id}>
                  <td>{i+1}</td>
                  <td style={{ fontWeight: 600 }}>{emp.first_name} {emp.second_name}</td>
                  <td>{emp.email}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-400)' }}>{new Date(emp.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>✏️ تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>🗑️ حذف</button>
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
