import React from 'react';

export default function SimulatedBadge({ label = "SIMULATED DATA", tooltip = "Demonstration data for prototype" }) {
  return (
    <span 
      title={tooltip}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
      {label}
    </span>
  );
}
