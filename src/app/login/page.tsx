'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'unverified') {
          setError(t('login_unverified') || 'Please verify your email first.');
        } else {
          setError(data.error || t('login_invalid'));
        }
      }
    } catch {
      setError(t('login_error'));
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-bg-warm)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo width={200} />
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.38rem', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.25px' }}>
            {t('login_welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginBottom: 24 }}>
            {t('login_sub')}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">{isAr ? 'البريد الإلكتروني أو اسم المستخدم' : 'Email or Username'}</label>
            <input
              id="email" type="text" className="form-input"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder={isAr ? 'أدخل بريدك أو اسم المستخدم' : 'Enter email or username'} required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('label_password')}</label>
            <input
              id="password" type="password" className="form-input"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  void login();
                }
              }}
              placeholder="••••••••" required
            />
          </div>
          <button
            type="button" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
            onClick={() => void login()}
          >
            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? t('btn_signing_in') : t('btn_signin')}
          </button>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            {t('login_no_account') || "Don't have an account? "}
            <Link href="/signup" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              {t('login_signup_link') || 'Sign up'}
            </Link>
          </p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    </div>
  );
}
