'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { booksAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Script from 'next/script';

export default function ReadBookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [numPages, setNumPages] = useState<number>(0);
  const [renderedPages, setRenderedPages] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfInstanceRef = useRef<any>(null);

  // Security prevention
  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'student') { router.replace('/login'); return; }

    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);

    const devToolsCheck = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        setError('⚠️ تم إغلاق الكتاب لأسباب أمنية');
      }
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      clearInterval(devToolsCheck);
      clearInterval(timerRef.current);
    };
  }, []);

  // Fetch book and load PDF
  useEffect(() => {
    if (!pdfLibLoaded) return;

    booksAPI.getReadUrl(id).then(async (res) => {
      setTitle(res.data.data.title);
      setTimeLeft(res.data.data.expires_in || 900);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setError('انتهت صلاحية الجلسة. يُرجى تحديث الصفحة.');
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // Load PDF via PDF.js
      try {
        const token = localStorage.getItem('access_token');
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(`/api/books/${id}/stream?token=${token}`);
        const pdf = await loadingTask.promise;
        pdfInstanceRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);

        // Render pages sequentially
        renderPages(pdf);
      } catch (err) {
        console.error('PDF Load Error:', err);
        setError('حدث خطأ أثناء تحميل صفحات الكتاب. حاول مجدداً.');
        setLoading(false);
      }
    }).catch(() => {
      setError('ليس لديك صلاحية لقراءة هذا الكتاب، أو لم يتم تأكيد دفعك بعد.');
      setLoading(false);
    });
  }, [id, pdfLibLoaded]);

  const renderPages = async (pdf: any) => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // Clear container

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // Good scale for reading

        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = '20px auto';
        canvas.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.background = '#ffffff';
        canvas.style.borderRadius = '4px';

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        containerRef.current.appendChild(canvas);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        setRenderedPages(pageNum);
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', flexDirection: 'column', gap: 20, padding: 20 }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <p style={{ color: '#f87171', textAlign: 'center', fontSize: 18, maxWidth: 400 }}>{error}</p>
      <button onClick={() => router.back()} className="btn btn-secondary">العودة</button>
    </div>
  );

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
        onLoad={() => setPdfLibLoaded(true)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', userSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
        onCopy={e => e.preventDefault()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#1e293b', borderBottom: '1px solid #334155', gap: 16, zIndex: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>←</button>
          <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>📖 {title}</h2>
          
          {!loading && numPages > 0 && (
            <div style={{ color: '#94a3b8', fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20 }}>
              الصفحات: {renderedPages} / {numPages}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 12px', borderRadius: 20 }}>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>⏱️ {formatTime(timeLeft)}</span>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: '#f87171' }}>
            🔒 محمي ضد السرقة
          </div>
        </div>

        {/* PDF Pages Scroll Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0, background: '#0f172a', flexDirection: 'column', gap: 16 }}>
              <div className="spinner" style={{ width: 40, height: 40 }} />
              <p style={{ color: '#94a3b8' }}>جاري تحميل صفحات الكتاب بأمان...</p>
            </div>
          )}

          <div ref={containerRef} style={{ width: '100%', maxWidth: '800px' }} />
        </div>
      </div>
    </>
  );
}
