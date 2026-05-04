'use client';

import React from 'react';

export default function Logo({ width = 180, height, className = '' }: { width?: number | string, height?: number | string, className?: string }) {
  return (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 260 50" 
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
      
      {/* Icon Part */}
      <rect x="0" y="5" width="40" height="40" rx="10" fill="url(#logo-grad)" />
      <path 
        d="M20 12L14 25H20L14 38L26 23H20L26 12H20Z" 
        fill="white"
      />

      {/* Text Part */}
      <text 
        x="55" 
        y="35" 
        fill="#1e293b" 
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="800"
        style={{ letterSpacing: '-0.02em' }}
      >
        Social<tspan fill="#4f46e5">Flow</tspan>
      </text>
    </svg>
  );
}


