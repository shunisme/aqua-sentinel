import React from 'react';
import { useApp } from '../../context/AppContext';

interface HandcraftedEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const HandcraftedEmptyState: React.FC<HandcraftedEmptyStateProps> = ({
  title,
  description,
  action,
}) => {
  const { themeMode } = useApp();
  const isHandcrafted = themeMode === 'handcrafted';

  return (
    <div className={`p-8 text-center rounded-lg border flex flex-col items-center justify-center transition-all ${
      isHandcrafted
        ? 'bg-[#FCFBF9] border-[#E8E4DC] shadow-xs'
        : 'bg-white border-[#E2E8F0]'
    }`}>
      {/* Handcrafted Water Droplet & Flow Contours SVG Illustration */}
      <div className="w-16 h-16 mb-3 rounded-full flex items-center justify-center relative">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-14 h-14"
        >
          {/* Subtle concentric contour ripples */}
          <circle
            cx="32"
            cy="36"
            r="24"
            stroke={isHandcrafted ? "#EFEAE1" : "#F1F5F9"}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx="32"
            cy="36"
            r="17"
            stroke={isHandcrafted ? "#E4DDD0" : "#E2E8F0"}
            strokeWidth="1.5"
          />

          {/* Central organic droplet with hatching */}
          <path
            d="M32 16C32 16 23 26.5 23 33.5C23 38.5 27 42.5 32 42.5C37 42.5 41 38.5 41 33.5C41 26.5 32 16 32 16Z"
            fill={isHandcrafted ? "#FAF4E8" : "#EFF6FF"}
            stroke={isHandcrafted ? "#B27B2A" : "#2563EB"}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Handcrafted interior diagonal measurement hash */}
          <path
            d="M27 33L37 33M28 37L36 37"
            stroke={isHandcrafted ? "#D4A864" : "#93C5FD"}
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className={`text-sm font-semibold mb-1 ${
        isHandcrafted ? 'text-[#1A2430] font-editorial text-base' : 'text-[#0F172A]'
      }`}>
        {title}
      </h3>
      <p className="text-xs text-[#707972] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            isHandcrafted
              ? 'bg-[#192635] hover:bg-[#25394E] text-[#FCFBF9] shadow-xs'
              : 'bg-[#0F2744] hover:bg-[#1E3A5F] text-white shadow-2xs'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
