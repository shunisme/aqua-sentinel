import React from 'react';

interface AquaSentinelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const AquaSentinelLogo: React.FC<AquaSentinelLogoProps> = ({
  size = 'md',
  showText = false,
  textColor = 'text-white',
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-sm' },
    md: { box: 'w-8 h-8', text: 'text-base' },
    lg: { box: 'w-10 h-10', text: 'text-lg' },
    xl: { box: 'w-12 h-12', text: 'text-xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Sentinel Shield & Aqua Droplet Mark */}
      <div className={`relative ${currentSize.box} flex-shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        >
          <defs>
            {/* Outer Sentinel Shield Metallic Gradient */}
            <linearGradient id="sentinelShieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="50%" stopColor="#15283D" />
              <stop offset="100%" stopColor="#0B1726" />
            </linearGradient>

            {/* Inner Aqua Droplet High-Luminance Gradient */}
            <linearGradient id="sentinelAquaGrad" x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>

            {/* Shield Outer Radiant Border */}
            <linearGradient id="sentinelBorderGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.4" />
            </linearGradient>

            {/* Subtle Core Glow */}
            <radialGradient id="sentinelCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Sentinel Outer Shield Geometry */}
          <path
            d="M20 3L34 8.5V18.5C34 27.2 27.8 34.6 20 37C12.2 34.6 6 27.2 6 18.5V8.5L20 3Z"
            fill="url(#sentinelShieldGrad)"
            stroke="url(#sentinelBorderGrad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* 2. Concentric Sonar / Radar Anomaly Detection Arcs */}
          <circle cx="20" cy="22" r="9" fill="url(#sentinelCoreGlow)" />
          <path
            d="M13.5 21C13.5 17.41 16.41 14.5 20 14.5C23.59 14.5 26.5 17.41 26.5 21"
            stroke="#38BDF8"
            strokeWidth="1.1"
            strokeDasharray="2 2"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />

          {/* 3. Pure Aqua Droplet Contour */}
          <path
            d="M20 10C20 10 25.5 17.8 25.5 21.8C25.5 24.8 23 27.2 20 27.2C17 27.2 14.5 24.8 14.5 21.8C14.5 17.8 20 10 20 10Z"
            fill="url(#sentinelAquaGrad)"
          />

          {/* 4. Handcrafted Precision Glint & Node */}
          <path
            d="M17.5 18.5C17.2 19.8 17.3 21.2 17.8 22.3"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <circle cx="20" cy="22" r="1.5" fill="#FFFFFF" fillOpacity="0.9" />
        </svg>
      </div>

      {showText && (
        <span className={`font-editorial font-bold tracking-tight ${currentSize.text} ${textColor}`}>
          Aqua Sentinel
        </span>
      )}
    </div>
  );
};
