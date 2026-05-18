'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI, settingsAPI } from '@/lib/api';

function SupportInfoBlock() {
  const [phone, setPhone] = useState('01234567890');
  useEffect(() => { settingsAPI.get().then(r => { if (r.data.data?.support_phone) setPhone(r.data.data.support_phone); }).catch(()=>{}); }, []);
  return (
    <div className="alert alert-info">
      <span>📞</span>
      <div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>تواصل مع أحد الموظفين لإعادة تعيين كلمة السر</p>
        <p>رقم التواصل: <strong dir="ltr">{phone}</strong></p>
        <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-400)' }}>ساعات العمل: 9 صباحاً - 5 مساءً</p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();
  const [supportInfo, setSupportInfo] = useState(false);

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setStep('sent');
    } catch { toast.error('حدث خطأ، حاول مجدداً'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h1>استرجاع كلمة السر</h1>
          <p>اختر طريقة استعادة الحساب</p>
        </div>

        {step === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h3 style={{ marginBottom: 12 }}>تم الإرسال!</h3>
            <p style={{ color: 'var(--text-400)', lineHeight: 1.8 }}>
              إذا كان البريد الإلكتروني مسجلاً، ستصل رسالة تحتوي على رابط إعادة تعيين كلمة السر.
              الرابط صالح لمدة 30 دقيقة.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ marginTop: 24 }}>العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setSupportInfo(false)} className="btn" style={{ flex: 1, background: !supportInfo ? 'rgba(79,70,229,0.15)' : 'var(--bg-700)', color: !supportInfo ? 'var(--primary-light)' : 'var(--text-300)', border: `1px solid ${!supportInfo ? 'var(--primary)' : 'var(--border)'}` }}>
                📧 عبر الإيميل
              </button>
              <button onClick={() => setSupportInfo(true)} className="btn" style={{ flex: 1, background: supportInfo ? 'rgba(79,70,229,0.15)' : 'var(--bg-700)', color: supportInfo ? 'var(--primary-light)' : 'var(--text-300)', border: `1px solid ${supportInfo ? 'var(--primary)' : 'var(--border)'}` }}>
                📞 التواصل مع الدعم
              </button>
            </div>

            {!supportInfo ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني المسجل</label>
                  <input type="email" className="form-input" placeholder="example@email.com"
                    {...register('email', { required: 'البريد الإلكتروني مطلوب', pattern: { value: /^\S+@\S+\.\S+$/, message: 'بريد إلكتروني غير صالح' } })} />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> جاري الإرسال...</> : 'إرسال رابط الاسترجاع'}
                </button>
              </form>
            ) : (
              <SupportInfoBlock />
            )}
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-400)' }}>
          <Link href="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>← العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
