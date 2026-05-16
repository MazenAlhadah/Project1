'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

interface RegisterForm {
  first_name: string; second_name: string; third_name: string; fourth_name: string;
  national_id: string; email: string; password: string; confirm_password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const handleFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) return toast.error('نوع الملف غير مسموح (jpg, png, pdf فقط)');
    if (file.size > 5 * 1024 * 1024) return toast.error('حجم الملف يتجاوز 5MB');
    setIdCardFile(file);
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (k !== 'confirm_password') formData.append(k, v); });
    if (idCardFile) formData.append('id_card', idCardFile);
    try {
      await authAPI.register(formData);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>تم استلام طلبك!</h2>
        <p style={{ color: 'var(--text-400)', marginBottom: 24, lineHeight: 1.8 }}>
          تم تسجيل بياناتك بنجاح.<br />
          حسابك حالياً قيد المراجعة من قِبَل فريقنا.<br />
          سيتم التواصل معك عند قبول طلبك.
        </p>
        <Link href="/login" className="btn btn-primary">العودة لتسجيل الدخول</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page" style={{ padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-logo">
          <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
          <h1>تسجيل طالب جديد</h1>
          <p>أنشئ حسابك للانضمام إلى المنصة</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { name: 'first_name', label: 'الاسم الأول' },
              { name: 'second_name', label: 'الاسم الثاني' },
              { name: 'third_name', label: 'الاسم الثالث' },
              { name: 'fourth_name', label: 'الاسم الرابع' },
            ].map(({ name, label }) => (
              <div className="form-group" key={name} style={{ marginBottom: 0 }}>
                <label className="form-label">{label} *</label>
                <input className="form-input" placeholder={label}
                  {...register(name as any, { required: `${label} مطلوب` })} />
                {errors[name as keyof RegisterForm] && <span className="form-error">{errors[name as keyof RegisterForm]?.message}</span>}
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">الرقم القومي * (14 رقم)</label>
            <input className="form-input" placeholder="أدخل الرقم القومي المكون من 14 رقم"
              {...register('national_id', {
                required: 'الرقم القومي مطلوب',
                pattern: { value: /^\d{14}$/, message: 'الرقم القومي يجب أن يكون 14 رقماً' }
              })} />
            {errors.national_id && <span className="form-error">{errors.national_id.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">البريد الإلكتروني (اختياري)</label>
            <input type="email" className="form-input" placeholder="example@email.com"
              {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'بريد إلكتروني غير صالح' } })} />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">كلمة السر *</label>
              <input type="password" className="form-input" placeholder="8 أحرف على الأقل"
                {...register('password', { required: 'كلمة السر مطلوبة', minLength: { value: 8, message: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' } })} />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">تأكيد كلمة السر *</label>
              <input type="password" className="form-input" placeholder="أعد إدخال كلمة السر"
                {...register('confirm_password', {
                  required: 'تأكيد كلمة السر مطلوب',
                  validate: v => v === password || 'كلمتا السر غير متطابقتين'
                })} />
              {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">صورة بطاقة الهوية *</label>
            <div
              className={`upload-area ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {idCardFile ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ color: 'var(--success)', fontWeight: 600 }}>{idCardFile.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-400)', marginTop: 4 }}>({(idCardFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📤</div>
                  <p style={{ fontWeight: 600 }}>اسحب الملف هنا أو انقر للاختيار</p>
                  <p style={{ fontSize: 12, color: 'var(--text-400)', marginTop: 4 }}>JPG, PNG, PDF — الحد الأقصى 5MB</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> جاري إرسال الطلب...</> : 'إرسال طلب التسجيل'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-400)' }}>
          لديك حساب بالفعل؟{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>سجل دخولك</Link>
        </p>
      </div>
    </div>
  );
}
