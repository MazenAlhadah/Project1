'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { coursesAPI } from '@/lib/api';
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', is_active: false, coming_soon: true });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = () => coursesAPI.getAll().then(r => setCourses(r.data.data || [])).catch(() => toast.error('خطأ في تحميل الكورسات')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditCourse(null); setForm({ title: '', description: '', is_active: false, coming_soon: true }); setCoverFile(null); setShowModal(true); };
  const openEdit = (course: any) => { setEditCourse(course); setForm({ title: course.title, description: course.description || '', is_active: course.is_active, coming_soon: course.coming_soon }); setCoverFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title) return toast.error('اسم الكورس مطلوب');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)));
    if (coverFile) fd.append('cover_image', coverFile);
    
    try {
      if (editCourse) {
        await coursesAPI.update(editCourse.id, fd);
        toast.success('تم تحديث الكورس');
      } else {
        await coursesAPI.create(fd);
        toast.success('تمت إضافة الكورس ✅');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكورس "${title}" نهائياً؟`)) return;
    try {
      await coursesAPI.delete(id);
      toast.success('تم حذف الكورس');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطأ أثناء الحذف');
    }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editCourse ? '✏️ تعديل الكورس' : '➕ إضافة كورس'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">اسم الكورس *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">الوصف</label>
              <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p=>({...p,is_active:e.target.checked}))} />
                <span>متاح للعرض (مفعل)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.coming_soon} onChange={e => setForm(p=>({...p,coming_soon:e.target.checked}))} />
                <span>قريباً (Coming Soon)</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">صورة الغلاف (اختياري)</label>
              <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => setCoverFile(e.target.files?.[0]||null)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>{coverFile ? `✅ ${coverFile.name}` : '📷 اختر صورة'}</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{width:16,height:16}}/> حفظ...</> : '💾 حفظ'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">إدارة الكورسات</h1>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة كورس</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: 'auto' }} />
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <h3>لا توجد كورسات</h3>
          <p>قم بإضافة الكورسات من الزر بالأعلى</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>الغلاف</th>
                <th>اسم الكورس</th>
                <th>الحالة</th>
                <th>الوسم (Label)</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>
                    {course.cover_image_url ? (
                      <img src={course.cover_image_url} alt={course.title} style={{width:80,height:48,objectFit:'cover',borderRadius:6}} />
                    ) : (
                      <span style={{fontSize:32}}>🎓</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{course.title}</td>
                  <td>
                    <span className={`badge badge-${course.is_active ? 'active' : 'rejected'}`}>
                      {course.is_active ? 'متاح' : 'مخفي'}
                    </span>
                  </td>
                  <td>
                    {course.coming_soon ? (
                      <span className="badge badge-pending">قريباً</span>
                    ) : (
                      <span className="badge badge-active">جاهز</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(course)}>✏️ تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id, course.title)}>🗑️ حذف</button>
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
