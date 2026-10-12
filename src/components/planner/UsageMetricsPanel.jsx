import React from 'react';
import SimulatedBadge from '../common/SimulatedBadge';
import { Package, Truck, Leaf, Clock, TrendingUp } from 'lucide-react';

export default function UsageMetricsPanel({ coveredCount, hubCount }) {
  // SIMULATED MODEL ASSUMPTIONS:
  // - 1.2 parcels per household per week (~0.17 parcels/home/day)
  // - Centralized hub delivery consolidates ~18 individual van door-to-door stops per hub
  // - ~120 grams of CO2 saved per avoided door-to-door diesel delivery stop
  // - Average 3.2 minutes walking time for residents within the 250m walking radius
  const dailyParcelsSimulated = Math.round(coveredCount * 0.17);
  const vanStopsSavedMonthly = Math.round(dailyParcelsSimulated * 30 * 0.85);
  const monthlyCo2KgSaved = Math.round((vanStopsSavedMonthly * 0.12));
  const courierMinutesSavedDaily = Math.round(dailyParcelsSimulated * 2.8); // 2.8 mins saved per parcel vs navigating gated roads

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
      {/* Header with prominent SIMULATED badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Township Operational Impact</h3>
          <p className="text-xs text-slate-500">Projected resident & carrier benefits</p>
        </div>
        <SimulatedBadge label="SIMULATED PROJECTIONS" tooltip="Theoretical estimates based on simulated delivery patterns" />
      </div>

      {/* Grid of 4 Impact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-semibold uppercase">Daily Volume</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono">{dailyParcelsSimulated}</span>
            <span className="text-[10px] text-slate-500">parcels/day</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">SIMULATED throughput at 85% adoption</p>
        </div>

        {/* Metric 2 */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Truck className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-semibold uppercase">Courier Stops</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono">-{vanStopsSavedMonthly}</span>
            <span className="text-[10px] text-slate-500">stops/mo</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Consolidated delivery to {hubCount} hubs</p>
        </div>

        {/* Metric 3 */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-semibold uppercase">CO₂ Abatement</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-600 font-mono">~{monthlyCo2KgSaved}</span>
            <span className="text-[10px] text-emerald-700">kg/mo</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Reduced diesel van idling in residential lanes</p>
        </div>

        {/* Metric 4 */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-[11px] font-semibold uppercase">Courier Time</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono">{courierMinutesSavedDaily}</span>
            <span className="text-[10px] text-slate-500">min/day</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Saved per delivery driver route</p>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-right italic">
        * All operational figures are SIMULATED model estimates for academic demonstration only.
      </div>
    </div>
  );
}
