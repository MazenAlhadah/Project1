'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setAuth, getDashboardPath } from '@/lib/auth';

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'warning' | 'error'; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await authAPI.login(data.identifier, data.password);
      const { user, access_token, refresh_token } = res.data.data;
      setAuth(user, access_token, refresh_token);
      toast.success(`مرحباً ${user.full_name} 👋`);
      router.replace(getDashboardPath(user.role));
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const message = err?.response?.data?.message || 'حدث خطأ، حاول مجدداً';
      if (code === 'PENDING') setStatusMsg({ type: 'warning', text: message });
      else if (code === 'REJECTED') setStatusMsg({ type: 'error', text: message });
      else toast.error(message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1>منصة معادلات الهندسة</h1>
          <p>سجل دخولك للوصول إلى المنصة</p>
        </div>

        {statusMsg && (
          <div className={`alert alert-${statusMsg.type === 'warning' ? 'warning' : 'error'}`}>
            <span>{statusMsg.type === 'warning' ? '⏳' : '❌'}</span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني أو الرقم القومي</label>
            <input
              className="form-input"
              placeholder="أدخل الإيميل أو الرقم القومي"
              {...register('identifier', { required: 'هذا الحقل مطلوب' })}
            />
            {errors.identifier && <span className="form-error">{errors.identifier.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">كلمة السر</label>
            <input
              type="password"
              className="form-input"
              placeholder="أدخل كلمة السر"
              {...register('password', { required: 'كلمة السر مطلوبة' })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <Link href="/forgot-password" style={{ color: 'var(--primary-light)', fontSize: 13, textDecoration: 'none' }}>
              نسيت كلمة السر؟
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> جاري التحقق...</> : 'تسجيل الدخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-400)' }}>
          ليس لديك حساب؟{' '}
          <Link href="/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
            سجل الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
