'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const EMP_NAV = [
  { href: '/employee/join-requests', label: 'طلبات الانضمام', icon: '📋' },
  { href: '/employee/payment-confirmations', label: 'تأكيد المدفوعات', icon: '💳' },
  { href: '/employee/books', label: 'إدارة الكتب', icon: '📚' },
  { href: '/employee/users', label: 'بيانات الطلاب', icon: '👥' },
];

export default function UsersPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tempPwd, setTempPwd] = useState<{ name: string; pwd: string } | null>(null);

  const load = () => usersAPI.getStudents().then(r => setStudents(r.data.data || [])).catch(() => toast.error('خطأ في التحميل')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleReset = async (id: string, name: string) => {
    if (!confirm(`إعادة تعيين كلمة سر ${name}؟`)) return;
    setResetting(id);
    try {
      const res = await usersAPI.resetPassword(id);
      setTempPwd({ name, pwd: res.data.data?.temp_password });
      toast.success('تم إعادة تعيين كلمة السر');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setResetting(null); }
  };

  const handleSuspend = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من تعليق حساب الطالب ${name}؟`)) return;
    setSuspending(id);
    try { await usersAPI.reject(id); toast.success('تم تعليق الحساب'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); }
    finally { setSuspending(null); }
  };

  const handleReactivate = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء تعليق وتفعيل حساب الطالب ${name}؟`)) return;
    setReactivating(id);
    try { await usersAPI.reactivate(id); toast.success('تم تفعيل الحساب'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); }
    finally { setReactivating(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`تحذير!\nهل أنت متأكد من حذف الطالب ${name} نهائياً؟\nسيتم حذف كل بياناته ولن يمكن التراجع!`)) return;
    setDeleting(id);
    try { await usersAPI.deleteStudent(id); toast.success('تم حذف الطالب نهائياً'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); }
    finally { setDeleting(null); }
  };

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.second_name} ${s.third_name} ${s.fourth_name}`.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || (s.national_id||'').includes(q) || (s.email||'').toLowerCase().includes(q);
  });

  const statusLabel = (s: string) => ({ pending: 'انتظار', active: 'مفعل', rejected: 'مرفوض' }[s] || s);

  return (
    <DashboardLayout requiredRole={['employee','admin']} navItems={EMP_NAV}>
      {tempPwd && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
            <h3 style={{ marginBottom: 8 }}>كلمة السر الجديدة لـ {tempPwd.name}</h3>
            <div style={{ background: 'var(--bg-700)', border: '2px dashed var(--primary)', padding: 20, borderRadius: 12, fontSize: 24, fontWeight: 800, letterSpacing: 4, margin: '16px 0' }} dir="ltr">
              {tempPwd.pwd}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-400)', marginBottom: 20 }}>أرسل هذه الكلمة للطالب. سيتم إرسالها على إيميله أيضاً إن وُجد.</p>
            <button className="btn btn-primary" onClick={() => setTempPwd(null)}>حسناً</button>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">بيانات الطلاب</h1>
        <p className="page-subtitle">عرض وإدارة بيانات جميع الطلاب المسجلين</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input className="form-input" style={{ maxWidth: 380 }} placeholder="🔍 ابحث بالاسم أو الرقم القومي أو الإيميل..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">👥</div><h3>لا يوجد طلاب</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>الاسم الرباعي</th><th>الرقم القومي</th><th>البريد الإلكتروني</th><th>الحالة</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map((s, i) => {
                const name = `${s.first_name} ${s.second_name} ${s.third_name} ${s.fourth_name}`;
                return (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-400)' }}>{i+1}</td>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td dir="ltr" style={{ fontFamily: 'monospace' }}>{s.national_id || '—'}</td>
                    <td style={{ fontSize: 13 }}>{s.email || '—'}</td>
                    <td><span className={`badge badge-${s.status}`}>{statusLabel(s.status)}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-400)' }}>{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-warning btn-sm" onClick={() => handleReset(s.id, name)} disabled={resetting === s.id}>
                          {resetting === s.id ? <span className="spinner" style={{width:14,height:14}}/> : '🔑 Password'}
                        </button>
                        {s.status !== 'rejected' ? (
                          <button className="btn btn-sm" style={{ background: '#f97316', color: 'white' }} onClick={() => handleSuspend(s.id, name)} disabled={suspending === s.id}>
                            {suspending === s.id ? <span className="spinner" style={{width:14,height:14}}/> : '⛔ تعليق'}
                          </button>
                        ) : (
                          <button className="btn btn-sm" style={{ background: '#10b981', color: 'white' }} onClick={() => handleReactivate(s.id, name)} disabled={reactivating === s.id}>
                            {reactivating === s.id ? <span className="spinner" style={{width:14,height:14}}/> : '✅ إلغاء التعليق'}
                          </button>
                        )}
                        <button className="btn btn-error btn-sm" onClick={() => handleDelete(s.id, name)} disabled={deleting === s.id}>
                          {deleting === s.id ? <span className="spinner" style={{width:14,height:14}}/> : '🗑️ حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
