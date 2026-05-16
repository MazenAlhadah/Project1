'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { booksAPI } from '@/lib/api';
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

export default function AdminBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);

  const load = () => booksAPI.getAllAdmin().then(r => setBooks(r.data.data || [])).catch(() => toast.error('خطأ')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditBook(null); setForm({ title: '', description: '', price: '' }); setCoverFile(null); setBookFile(null); setShowModal(true); };
  const openEdit = (book: any) => { setEditBook(book); setForm({ title: book.title, description: book.description || '', price: book.price }); setCoverFile(null); setBookFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.price) return toast.error('اسم الكتاب والسعر مطلوبان');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (coverFile) fd.append('cover_image', coverFile);
    if (bookFile) fd.append('book_file', bookFile);
    try {
      if (editBook) { await booksAPI.update(editBook.id, fd); toast.success('تم التحديث'); }
      else { if (!bookFile) return toast.error('ملف الكتاب مطلوب'); await booksAPI.create(fd); toast.success('تم الإضافة ✅'); }
      setShowModal(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`حذف "${title}"؟`)) return;
    try { await booksAPI.delete(id); toast.success('تم الحذف'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'خطأ'); }
  };

  return (
    <DashboardLayout requiredRole="admin" navItems={ADMIN_NAV}>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header"><h3 className="modal-title">{editBook ? '✏️ تعديل الكتاب' : '➕ إضافة كتاب'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">اسم الكتاب *</label><input className="form-input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">الوصف</label><textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">السعر (جنيه) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} min={0} /></div>
            <div className="form-group">
              <label className="form-label">صورة الغلاف</label>
              <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => setCoverFile(e.target.files?.[0]||null)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>{coverFile ? `✅ ${coverFile.name}` : '📷 اختر صورة'}</button>
            </div>
            <div className="form-group">
              <label className="form-label">ملف PDF {!editBook && '*'}</label>
              <input ref={bookRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e => setBookFile(e.target.files?.[0]||null)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => bookRef.current?.click()}>{bookFile ? `✅ ${bookFile.name}` : '📄 اختر PDF'}</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? <><span className="spinner" style={{width:16,height:16}}/> حفظ...</> : '💾 حفظ'}</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1 className="page-title">إدارة الكتب</h1></div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة كتاب</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : books.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📚</div><h3>لا توجد كتب</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>الغلاف</th><th>الاسم</th><th>السعر</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td>{book.cover_image_url ? <img src={book.cover_image_url} alt={book.title} style={{width:48,height:64,objectFit:'cover',borderRadius:6}} /> : <span style={{fontSize:32}}>📖</span>}</td>
                  <td style={{ fontWeight: 600 }}>{book.title}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{parseFloat(book.price).toFixed(0)} جنيه</td>
                  <td><span className={`badge badge-${book.is_active?'active':'rejected'}`}>{book.is_active?'متاح':'مخفي'}</span></td>
                  <td><div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(book)}>✏️ تعديل</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(book.id, book.title)}>🗑️ حذف</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
