'use client';

import React from 'react';

export default function Logo({ size = 32, fontSize = '1.5rem', className = '' }: { size?: number, fontSize?: string, className?: string }) {
  return (
    <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Icon: Abstract 'S' with Lightning Bolt */}
      <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="logo-grad-new" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#logo-grad-new)" />
          <path 
            d="M20 8L14 21H20L14 34L26 19H20L26 8H20Z" 
            fill="white"
          />
        </svg>
      </div>

      {/* Text Part: SocialFlow */}
      <div style={{ 
        fontSize: fontSize, 
        fontWeight: 800, 
        fontFamily: "'Inter', system-ui, sans-serif", 
        letterSpacing: '-0.03em',
        color: '#1e293b',
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}>
        Social<span style={{ color: '#4f46e5' }}>Flow</span>
      </div>
    </div>
  );
}



