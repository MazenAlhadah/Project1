'use client';
import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

interface ResetForm { new_password: string; confirm_password: string; }

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();
  const newPwd = watch('new_password');

  if (!token) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2>رابط غير صالح</h2>
        <p style={{ color: 'var(--text-400)', marginTop: 12 }}>الرابط غير صحيح أو منتهي الصلاحية.</p>
        <Link href="/forgot-password" className="btn btn-primary" style={{ marginTop: 20 }}>طلب رابط جديد</Link>
      </div>
    </div>
  );

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2>تم تغيير كلمة السر!</h2>
        <p style={{ color: 'var(--text-400)', marginTop: 12 }}>يمكنك الآن تسجيل الدخول بكلمة السر الجديدة.</p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 24 }}>تسجيل الدخول</Link>
      </div>
    </div>
  );

  const onSubmit = async ({ new_password }: ResetForm) => {
    setLoading(true);
    try { await authAPI.resetPassword(token, new_password); setSuccess(true); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'الرابط منتهي الصلاحية أو غير صالح'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div><h1>إعادة تعيين كلمة السر</h1></div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">كلمة السر الجديدة</label>
            <input type="password" className="form-input" placeholder="8 أحرف على الأقل"
              {...register('new_password', { required: 'مطلوب', minLength: { value: 8, message: '8 أحرف على الأقل' } })} />
            {errors.new_password && <span className="form-error">{errors.new_password.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">تأكيد كلمة السر</label>
            <input type="password" className="form-input" placeholder="أعد إدخال كلمة السر"
              {...register('confirm_password', { required: 'مطلوب', validate: v => v === newPwd || 'كلمتا السر غير متطابقتين' })} />
            {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}}/> جاري التغيير...</> : 'تغيير كلمة السر'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
