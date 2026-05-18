'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { booksAPI, purchasesAPI, settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/student/courses', label: 'الكورسات', icon: '🎓' },
  { href: '/student/books', label: 'الكتب', icon: '📚' },
];

export default function StudentBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    Promise.all([
      booksAPI.getAll(),
      settingsAPI.get(),
    ]).then(([booksRes, settingsRes]) => {
      setBooks(booksRes.data.data || []);
      setWhatsapp(settingsRes.data.data?.whatsapp_number || '');
    }).catch(() => toast.error('خطأ في تحميل البيانات')).finally(() => setLoading(false));
  }, []);

  const handleBuy = async (book: any) => {
    setRequesting(book.id);
    try {
      await purchasesAPI.request(book.id);
      const waMsg = encodeURIComponent(`أريد شراء كتاب: ${book.title}`);
      const waUrl = `https://wa.me/${whatsapp}?text=${waMsg}`;
      window.open(waUrl, '_blank');
      toast.success('تم إرسال طلب الشراء! تواصل مع الموظف عبر واتساب لإتمام الدفع.');
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, purchase_requested: true } : b));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ';
      if (msg.includes('بالفعل') || msg.includes('الانتظار')) {
        const waMsg = encodeURIComponent(`أريد متابعة دفع كتاب: ${book.title}`);
        window.open(`https://wa.me/${whatsapp}?text=${waMsg}`, '_blank');
      } else toast.error(msg);
    } finally { setRequesting(null); }
  };

  const handleRead = (bookId: string) => {
    window.open(`/student/books/read/${bookId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout requiredRole="student" navItems={NAV}>
      <div className="page-header">
        <h1 className="page-title">الكتب</h1>
        <p className="page-subtitle">اشترِ الكتب الهندسية التي تحتاجها</p>
      </div>

      {loading ? (
        <div className="books-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="book-card">
              <div className="skeleton" style={{ height: 280 }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 18, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 36 }} />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>لا توجد كتب متاحة حالياً</h3>
          <p>سيتم إضافة الكتب قريباً</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book.id} className="book-card">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="book-cover" />
              ) : (
                <div className="book-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📖</div>
              )}
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                {book.description && <p style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.description}</p>}
                <p className="book-price">{parseFloat(book.price).toFixed(0)} جنيه</p>
                {book.is_purchased ? (
                  <button className="btn btn-success btn-full btn-sm" onClick={() => handleRead(book.id)}>
                    📖 اقرأ الآن
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-full btn-sm"
                    onClick={() => handleBuy(book)}
                    disabled={requesting === book.id}
                  >
                    {requesting === book.id ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '🛒 شراء عبر واتساب'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
