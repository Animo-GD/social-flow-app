'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageCircle, BarChart2,
  Settings, TrendingUp, Zap, LogOut, Building2,
} from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import type { TranslationKey } from '@/lib/i18n';

const NAV: { href: string; key: TranslationKey; icon: React.ComponentType<{ size?: number }> }[] = [
  { href: '/dashboard',            key: 'nav_overview',   icon: LayoutDashboard },
  { href: '/dashboard/posts',      key: 'nav_posts',      icon: FileText },
  { href: '/dashboard/messages',   key: 'nav_messages',   icon: MessageCircle },
  { href: '/dashboard/analytics',  key: 'nav_analytics',  icon: BarChart2 },
  { href: '/dashboard/trends',     key: 'nav_trends',     icon: TrendingUp },
  { href: '/dashboard/business',   key: 'nav_business',   icon: Building2 },
  { href: '/dashboard/settings',   key: 'nav_settings',   icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const { lang, setLang, t } = useLang();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={18} color="#fff" />
        </div>
        <span className="sidebar-brand-name">SocialFlow</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link key={href} href={href} className={`sidebar-link${active ? ' active' : ''}`}>
              <Icon size={16} />
              {t(key)}
            </Link>
          );
        })}
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
