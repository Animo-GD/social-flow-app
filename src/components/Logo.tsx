'use client';

import React from 'react';

export default function Logo({ width = 180, height, className = '' }: { width?: number | string, height?: number | string, className?: string }) {
  return (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 220 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      
      {/* Icon: Abstract 'S' with Lightning Bolt */}
      <rect x="0" y="5" width="40" height="40" rx="10" fill="url(#logo-grad)" />
      <path 
        d="M20 12L14 25H20L14 38L26 23H20L26 12H20Z" 
        fill="white"
      />

      {/* Text: SocialFlow */}
      <text 
        x="52" 
        y="34" 
        fill="#1e293b" 
        style={{ 
          fontSize: '26px', 
          fontWeight: 800, 
          fontFamily: "'Inter', system-ui, sans-serif", 
          letterSpacing: '-0.03em' 
        }}
      >
        Social
        <tspan fill="#4f46e5">Flow</tspan>
      </text>
    </svg>
  );
}

