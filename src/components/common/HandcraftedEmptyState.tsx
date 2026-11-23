import React from 'react';

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
  return (
    <div className="p-8 text-center rounded-lg border border-[#E2E8F0] bg-white flex flex-col items-center justify-center shadow-2xs">
      {/* Precision Instrument Droplet Vector */}
      <div className="w-12 h-12 mb-3 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#64748B] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-3.5 py-1.5 rounded bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
