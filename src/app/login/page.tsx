'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@socialflow.ai');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get CSRF token first
    try {
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password, csrfToken, redirect: 'false' }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && !data.error) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Invalid email or password.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-bg-warm)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: 'var(--color-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SocialFlow</span>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.38rem', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.25px' }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginBottom: 24 }}>
            Sign in to your AI marketing dashboard
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Demo credentials: <strong>admin@socialflow.ai</strong> / <strong>demo</strong>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
