'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import WelcomePopup from '@/components/WelcomePopup';
import BusinessOnboarding from '@/components/BusinessOnboarding';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // We need to know if onboarding is needed to decide when to show the welcome popup
  const { data: profile, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => fetch('/api/business').then(r => r.json()),
  });

  const showOnboarding = !isLoading && (!profile || !profile.name);

  // 1. If we are still loading the business profile status, show a simple loader
  // This prevents the dashboard from flickering before the onboarding overlay appears.
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  // 2. If onboarding is required, ONLY render the onboarding component.
  // This completely hides the sidebar and main content until the profile is ready.
  if (showOnboarding) {
    return <BusinessOnboarding />;
  }

  // 3. Otherwise, render the full dashboard shell
  return (
    <div className="layout-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen ? <button className="sidebar-overlay" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} /> : null}
      <main className="main-content">
        <div className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>
          <span className="mobile-brand">SocialFlow</span>
        </div>
        {children}
      </main>

      {/* The Welcome Popup shows AFTER onboarding is confirmed (since showOnboarding is now false) */}
      <WelcomePopup />
    </div>
  );
}
