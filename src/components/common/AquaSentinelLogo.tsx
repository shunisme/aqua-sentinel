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
  textColor = 'text-current',
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-sm font-semibold' },
    md: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-base font-semibold' },
    lg: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-lg font-semibold' },
    xl: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-xl font-semibold' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Flat utilitarian telemetry shield & water drop mark */}
      <div className={`${currentSize.box} flex-shrink-0 flex items-center justify-center rounded-md bg-[#1E293B] text-white`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={currentSize.icon}
        >
          {/* Shield contour */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {/* Water droplet inside shield */}
          <path d="M12 7c-1.5 2-3 4-3 5.5a3 3 0 0 0 6 0C15 11 13.5 9 12 7z" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {showText && (
        <span className={`tracking-tight ${currentSize.text} ${textColor}`}>
          Aqua Sentinel
        </span>
      )}
    </div>
  );
};
