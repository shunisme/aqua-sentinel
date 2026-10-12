import React from 'react';
import { Sliders, DollarSign, CheckCircle2, TrendingUp, Building2, MapPin } from 'lucide-react';

export default function HubCoverageControls({
  hubCount,
  setHubCount,
  coveragePercent,
  coveredCount,
  totalHomes,
  costPerHub,
  setCostPerHub,
  selectedHubs = []
}) {
  const totalCost = hubCount * costPerHub;
  const costPerHomeCovered = coveredCount > 0 ? Math.round(totalCost / coveredCount) : 0;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Hub Optimization Model</h3>
            <p className="text-xs text-slate-500">Greedy Maximal Coverage (MCLP)</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {totalHomes} homes analyzed
        </span>
      </div>

      {/* Hub Count Slider (1 to 8) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="hub-slider" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Number of Hubs (K)
          </label>
          <span className="text-lg font-black text-red-600 font-mono">
            {hubCount} <span className="text-xs font-normal text-slate-500">of 8 hubs</span>
          </span>
        </div>
        <input
          id="hub-slider"
          type="range"
          min="1"
          max="8"
          step="1"
          value={hubCount}
          onChange={(e) => setHubCount(parseInt(e.target.value, 10))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-hidden"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
        </div>
      </div>

      {/* Coverage Progress Card */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Township Walking Coverage</span>
          <span className="text-xl font-black text-emerald-600 font-mono">
            {coveragePercent}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(coveragePercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-600 pt-1">
          <span>Covered: <strong className="text-slate-900">{coveredCount}</strong> homes</span>
          <span>Uncovered: <strong className="text-slate-900">{totalHomes - coveredCount}</strong> homes</span>
        </div>
      </div>

      {/* Cost Assumptions (Editable) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          Capital Expenditure Assumptions
        </h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="cost-input" className="text-slate-600">Cost per 4-Door Hub (MYR):</label>
            <div className="relative w-32">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 font-mono">RM</span>
              <input
                id="cost-input"
                type="number"
                min="1000"
                step="500"
                value={costPerHub}
                onChange={(e) => setCostPerHub(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-8 pr-2 py-1 text-right text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Cost Summary Cards */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Capex</p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                RM {totalCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">Capex / Covered Home</p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                RM {costPerHomeCovered.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Hub Ranking Table */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          Optimized Hub Placements (Order of Value)
        </h4>

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {selectedHubs.map((hub) => (
            <div
              key={hub.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs border border-slate-200/80 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {hub.order}
                </span>
                <div className="truncate">
                  <p className="font-semibold text-slate-800 truncate">{hub.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{hub.type}</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-[11px] font-bold text-emerald-600">+{hub.marginalCoveredHomes}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{hub.cumulativeCoveragePercent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
