'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
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

      {/* 
         Sequence: 
         1. Business Onboarding (highest priority, blocks interaction)
         2. Welcome Popup (only shows AFTER onboarding is done or if not needed)
      */}
      <BusinessOnboarding />
      {!showOnboarding && <WelcomePopup />}
    </div>
  );
}
