'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { settingsAPI } from '@/lib/api';
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

export default function SettingsPage() {
  const [form, setForm] = useState({ whatsapp_number: '', support_phone: '', support_email: '', platform_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(r => {
      const d = r.data.data;
      setForm({ whatsapp_number: d.whatsapp_number||'', support_phone: d.support_phone||'', support_email: d.support_email||'', platform_name: d.platform_name||'' });
    }).catch(() => toast.error('خطأ في تحميل الإعدادات')).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await settingsAPI.update(form); toast.success('تم حفظ الإعدادات ✅'); }
    catch { toast.error('حدث خطأ في الحفظ'); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      <div className="page-header"><h1 className="page-title">⚙️ الإعدادات</h1><p className="page-subtitle">إدارة إعدادات المنصة</p></div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : (
        <div style={{ maxWidth: 600 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 700 }}>📱 بيانات التواصل</h3>

            <div className="form-group">
              <label className="form-label">رقم الواتساب (مع كود الدولة)</label>
              <input className="form-input" value={form.whatsapp_number} onChange={e => setForm(p=>({...p,whatsapp_number:e.target.value}))} placeholder="201234567890" dir="ltr" />
              <p className="form-hint">مثال: 201234567890 (بدون +)</p>
            </div>

            <div className="form-group">
              <label className="form-label">رقم الدعم الفني</label>
              <input className="form-input" value={form.support_phone} onChange={e => setForm(p=>({...p,support_phone:e.target.value}))} placeholder="01234567890" dir="ltr" />
            </div>

            <div className="form-group">
              <label className="form-label">إيميل الدعم الفني</label>
              <input type="email" className="form-input" value={form.support_email} onChange={e => setForm(p=>({...p,support_email:e.target.value}))} placeholder="support@domain.com" dir="ltr" />
            </div>

            <div className="form-group">
              <label className="form-label">اسم المنصة</label>
              <input className="form-input" value={form.platform_name} onChange={e => setForm(p=>({...p,platform_name:e.target.value}))} placeholder="منصة معادلات الهندسة" />
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? <><span className="spinner" style={{width:16,height:16}}/> جاري الحفظ...</> : '💾 حفظ الإعدادات'}
            </button>
          </div>

          <div className="alert alert-info" style={{ marginTop: 20 }}>
            <span>ℹ️</span>
            <div>
              <p style={{ fontWeight: 600 }}>معاينة رابط الواتساب</p>
              <p dir="ltr" style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4, wordBreak: 'break-all' }}>
                https://wa.me/{form.whatsapp_number}?text=أريد شراء كتاب: [اسم الكتاب]
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
