'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import Link from 'next/link';

type Step = 'form' | 'verify';

import { Suspense } from 'react';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    preferred_language: 'en',
  });

  // OTP verification
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const verifyParam = searchParams.get('verify');
    if (emailParam && verifyParam === '1') {
      setForm(f => ({ ...f, email: emailParam }));
      setStep('verify');

      // Auto trigger resend code
      fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      }).catch(console.error);
    }
  }, [searchParams]);

  async function handleSignup() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        setStep('verify');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handleResend() {
    try {
      await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch { }
  }

  const isAr = lang === 'ar';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-warm)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: 'var(--color-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SocialFlow</span>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {step === 'form' ? (
            <>
              <h1 style={{ fontSize: '1.38rem', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.25px' }}>
                {isAr ? 'إنشاء حساب جديد' : 'Create your account'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginBottom: 24 }}>
                {isAr ? 'انضم إلى SocialFlow وابدأ مجانًا' : 'Join SocialFlow and start for free'}
              </p>

              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم المستخدم *' : 'Username *'}</label>
                <input
                  className="form-input"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder={isAr ? 'مثال: ahmed_smith@' : 'e.g. @alex_creative'}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {isAr ? 'حروف وأرقام وشرطة سفلية فقط (3-30 حرف)' : 'Letters, numbers, underscore only (3-30 chars)'}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">{isAr ? 'البريد الإلكتروني *' : 'Email *'}</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isAr ? 'كلمة المرور *' : 'Password *'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder={isAr ? '8 أحرف على الأقل' : 'Minimum 8 characters'}
                    required
                    style={{ paddingInlineEnd: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{isAr ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)'}</label>
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+20 123 456 7890"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isAr ? 'اللغة المفضلة' : 'Preferred Language'}</label>
                <select className="form-select" value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                disabled={loading}
                onClick={handleSignup}
              >
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? (isAr ? 'جارٍ الإنشاء…' : 'Creating account…') : (isAr ? 'إنشاء الحساب' : 'Create Account')}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.38rem', fontWeight: 700, marginBottom: 6 }}>
                {isAr ? 'تحقق من بريدك الإلكتروني' : 'Verify your email'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginBottom: 24 }}>
                {isAr
                  ? `أرسلنا رمز مكون من 6 أرقام إلى ${form.email}`
                  : `We sent a 6-digit code to ${form.email}`}
              </p>

              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{isAr ? 'رمز التحقق' : 'Verification Code'}</label>
                <input
                  className="form-input"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ fontSize: '1.5rem', letterSpacing: 8, textAlign: 'center' }}
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || code.length !== 6}
                onClick={handleVerify}
              >
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? (isAr ? 'جارٍ التحقق…' : 'Verifying…') : (isAr ? 'تأكيد الرمز' : 'Confirm Code')}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                disabled={resendCooldown > 0}
                onClick={handleResend}
              >
                {resendCooldown > 0
                  ? (isAr ? `إعادة الإرسال خلال ${resendCooldown}ث` : `Resend in ${resendCooldown}s`)
                  : (isAr ? 'إعادة إرسال الرمز' : 'Resend Code')}
              </button>

              <button
                type="button"
                style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
                onClick={() => setStep('form')}
              >
                {isAr ? '← تعديل البريد الإلكتروني' : '← Change email'}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
