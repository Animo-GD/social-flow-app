'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
    </div>
  );
}
