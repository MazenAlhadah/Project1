'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { booksAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const EMP_NAV = [
  { href: '/employee/join-requests', label: 'طلبات الانضمام', icon: '📋' },
  { href: '/employee/payment-confirmations', label: 'تأكيد المدفوعات', icon: '💳' },
  { href: '/employee/books', label: 'إدارة الكتب', icon: '📚' },
  { href: '/employee/users', label: 'بيانات الطلاب', icon: '👥' },
];

export default function ManageBooksPage() {
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

  const load = () => booksAPI.getAllAdmin().then(r => setBooks(r.data.data || [])).catch(() => toast.error('خطأ في التحميل')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditBook(null); setForm({ title: '', description: '', price: '' }); setCoverFile(null); setBookFile(null); setShowModal(true); };
  const openEdit = (book: any) => { setEditBook(book); setForm({ title: book.title, description: book.description || '', price: book.price }); setCoverFile(null); setBookFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.price) return toast.error('اسم الكتاب والسعر مطلوبان');
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('price', form.price);
    if (coverFile) fd.append('cover_image', coverFile);
    if (bookFile) fd.append('book_file', bookFile);
    try {
      if (editBook) { await booksAPI.update(editBook.id, fd); toast.success('تم تحديث الكتاب'); }
      else {
        if (!bookFile) return toast.error('ملف الكتاب مطلوب');
        await booksAPI.create(fd); toast.success('تم إضافة الكتاب ✅');
      }
      setShowModal(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`حذف كتاب "${title}"؟`)) return;
    try { await booksAPI.delete(id); toast.success('تم الحذف'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'حدث خطأ'); }
  };

  return (
    <DashboardLayout requiredRole={['employee','admin']} navItems={EMP_NAV}>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editBook ? '✏️ تعديل الكتاب' : '➕ إضافة كتاب جديد'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label className="form-label">اسم الكتاب *</label><input className="form-input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="أدخل اسم الكتاب" /></div>
            <div className="form-group"><label className="form-label">الوصف</label><textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="وصف مختصر للكتاب" /></div>
            <div className="form-group"><label className="form-label">السعر (جنيه) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} placeholder="0" min={0} /></div>
            <div className="form-group">
              <label className="form-label">صورة الغلاف {!editBook && '(اختياري)'}</label>
              <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => setCoverFile(e.target.files?.[0]||null)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>
                {coverFile ? `✅ ${coverFile.name}` : '📷 اختر صورة الغلاف'}
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">ملف الكتاب (PDF) {!editBook && '*'}</label>
              <input ref={bookRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e => setBookFile(e.target.files?.[0]||null)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => bookRef.current?.click()}>
                {bookFile ? `✅ ${bookFile.name}` : '📄 اختر ملف PDF'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{width:16,height:16}}/> جاري الحفظ...</> : '💾 حفظ'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1 className="page-title">إدارة الكتب</h1><p className="page-subtitle">إضافة وتعديل وحذف الكتب</p></div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة كتاب</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      : books.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📚</div><h3>لا توجد كتب بعد</h3></div>
      : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>الغلاف</th><th>الاسم</th><th>السعر</th><th>الحالة</th><th>تاريخ الإضافة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td>{book.cover_image_url ? <img src={book.cover_image_url} alt={book.title} style={{width:48,height:64,objectFit:'cover',borderRadius:6}} /> : <span style={{fontSize:32}}>📖</span>}</td>
                  <td style={{ fontWeight: 600 }}>{book.title}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{parseFloat(book.price).toFixed(0)} جنيه</td>
                  <td><span className={`badge badge-${book.is_active?'active':'rejected'}`}>{book.is_active?'متاح':'مخفي'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-400)' }}>{new Date(book.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(book)}>✏️ تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(book.id, book.title)}>🗑️ حذف</button>
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
