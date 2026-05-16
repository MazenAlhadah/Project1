'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { booksAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function ReadBookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'student') { router.replace('/login'); return; }

    // منع right-click وكليك على الصفحة
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);

    // كشف DevTools (بسيط)
    const devToolsCheck = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        setError('⚠️ تم إغلاق الكتاب لأسباب أمنية');
        setUrl(null);
      }
    }, 1000);

    booksAPI.getReadUrl(id).then(res => {
      setUrl(res.data.data.url);
      setTitle(res.data.data.title);
      setTimeLeft(res.data.data.expires_in || 900);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setUrl(null);
            setError('انتهت صلاحية الجلسة. يُرجى تحديث الصفحة.');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }).catch(() => {
      setError('ليس لديك صلاحية لقراءة هذا الكتاب، أو لم يتم تأكيد دفعك بعد.');
    }).finally(() => setLoading(false));

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      clearInterval(devToolsCheck);
      clearInterval(timerRef.current);
    };
  }, [id]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: '#94a3b8' }}>جاري تحميل الكتاب...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', flexDirection: 'column', gap: 20, padding: 20 }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <p style={{ color: '#f87171', textAlign: 'center', fontSize: 18, maxWidth: 400 }}>{error}</p>
      <button onClick={() => router.back()} className="btn btn-secondary">العودة</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', userSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
      onCopy={e => e.preventDefault()}
    >
      {/* شريط أعلوي */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#1e293b', borderBottom: '1px solid #334155', gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>←</button>
        <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>📖 {title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 12px', borderRadius: 20 }}>
          <span style={{ color: '#fbbf24', fontSize: 13 }}>⏱️ {formatTime(timeLeft)}</span>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: '#f87171' }}>
          🔒 محمي
        </div>
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onContextMenu={e => e.preventDefault()}
      >
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-fit`}
          style={{ width: '100%', height: '100%', border: 'none', userSelect: 'none' }}
          title={title}
          sandbox="allow-scripts allow-same-origin"
          onContextMenu={e => e.preventDefault()}
        />
        {/* طبقة شفافة تمنع النقر المباشر على الـ PDF */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
