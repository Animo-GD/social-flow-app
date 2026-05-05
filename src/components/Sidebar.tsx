'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageCircle, BarChart2,
  Settings, TrendingUp, LogOut, Building2, Shield, X, CreditCard, UserCircle, LayoutTemplate
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLang } from '@/lib/LanguageContext';
import type { TranslationKey } from '@/lib/i18n';
import Logo from '@/components/Logo';

const NAV: { href: string; key: TranslationKey; icon: React.ComponentType<{ size?: number }> }[] = [
  { href: '/dashboard',            key: 'nav_overview',   icon: LayoutDashboard },
  { href: '/dashboard/posts',      key: 'nav_posts',      icon: FileText },
  { href: '/dashboard/messages',   key: 'nav_messages',   icon: MessageCircle },
  { href: '/dashboard/analytics',  key: 'nav_analytics',  icon: BarChart2 },
  { href: '/dashboard/trends',     key: 'nav_trends',     icon: TrendingUp },
  { href: '/dashboard/templates',  key: 'nav_templates',  icon: LayoutTemplate },
  { href: '/dashboard/settings',   key: 'nav_settings',   icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const path = usePathname();
  const { lang, setLang, t } = useLang();

  const { data: authData } = useQuery({
    queryKey: ['session'],
    queryFn: () => fetch('/api/auth/login').then(r => r.json()),
    staleTime: 60_000,
  });
  const isAdmin = authData?.user?.isAdmin === true;

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => fetch('/api/user/profile').then(r => r.json()),
    staleTime: 60_000,
  });

  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand" style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
        <Logo size={32} fontSize="1.25rem" />
        <button className="mobile-close-btn" type="button" aria-label="Close menu" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link key={href} href={href} className={`sidebar-link${active ? ' active' : ''}`} onClick={onClose}>
              <Icon size={16} />
              {t(key)}
            </Link>
          );
        })}
        {isAdmin && (
          <Link href="/dashboard/admin" className={`sidebar-link${path === '/dashboard/admin' ? ' active' : ''}`} onClick={onClose}>
            <Shield size={16} />
            {t('nav_admin')}
          </Link>
        )}
      </nav>

      {/* Language switcher */}
      <div style={{ padding: '0 8px', marginTop: 8 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 4px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('language')}
        </div>
        <div className="lang-switcher">
          <button
            className={`lang-btn${lang === 'en' ? ' active' : ''}`}
            onClick={() => setLang('en')}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            className={`lang-btn${lang === 'ar' ? ' active' : ''}`}
            onClick={() => setLang('ar')}
            aria-label="Switch to Arabic"
            style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
          >
            عربي
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div style={{ padding: '8px 8px 0', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
        <Link
          href="/dashboard/profile"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--color-text-primary)', transition: 'background 0.12s' }}
          onClick={onClose}
        >
          {userProfile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userProfile.avatar_url}
              alt="avatar"
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(userProfile?.username ?? userProfile?.email ?? '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.username ?? userProfile?.name ?? 'User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.credits ?? 0} {t('nav_credits_short') ?? 'credits'}
            </div>
          </div>
        </Link>
      </div>

      {/* Sign out */}
      <div style={{ padding: '8px 8px 0' }}>
        <button
          className="sidebar-link"
          style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
          onClick={async () => {
            await fetch('/api/auth/login', { method: 'DELETE' });
            window.location.href = '/login';
          }}
        >
          <LogOut size={16} />
          {t('nav_signout')}
        </button>
      </div>
    </aside>
  );
}
