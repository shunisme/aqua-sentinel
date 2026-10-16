import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';
import { calculateBuildingPriorityScore } from '../../services/priorityScorer';
import {
  ClipboardList,
  Search,
  Calculator,
  Info,
} from 'lucide-react';

interface InspectionQueuePageProps {
  onOpenCreateInspection: (buildingId: string) => void;
}

export const InspectionQueuePage: React.FC<InspectionQueuePageProps> = ({
  onOpenCreateInspection,
}) => {
  const {
    buildings,
    alerts,
    inspections,
    settings,
    setSelectedBuildingId,
    setCurrentPage,
  } = useApp();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBreakdown, setSelectedBreakdown] = useState<{
    buildingName: string;
    buildingId: string;
    breakdown: any;
    priorityScore: number;
  } | null>(null);

  // Compute full priority queue for all 20 buildings
  const queueItems = useMemo(() => {
    return buildings
      .map((b) => {
        const scoreRes = calculateBuildingPriorityScore(b, alerts, settings);
        const existingInspection = inspections.find((i) => i.buildingId === b.id);

        const potentialExcessDaily = Math.max(
          0,
          b.currentDailyLitres - b.expectedDailyLitres
        );

        return {
          building: b,
          score: scoreRes.score,
          tier: scoreRes.tier,
          breakdown: scoreRes.breakdown,
          urgencyReason: scoreRes.urgencyReason,
          recommendedAction: scoreRes.recommendedAction,
          inspection: existingInspection,
          potentialExcessDaily,
          assignedInspector: existingInspection?.assignedInspector || 'Unassigned',
          status: existingInspection ? existingInspection.status : ('None' as const),
        };
      })
      .filter((item) => {
        const matchesSearch =
          item.building.name.toLowerCase().includes(search.toLowerCase()) ||
          item.building.id.toLowerCase().includes(search.toLowerCase()) ||
          item.building.zone.toLowerCase().includes(search.toLowerCase());

        const matchesTier = tierFilter === 'ALL' || item.tier === tierFilter;

        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'Needs Inspection'
            ? item.status === 'None' || item.status === 'Open'
            : item.status === statusFilter);

        return matchesSearch && matchesTier && matchesStatus;
      })
      .sort((a, b) => b.score - a.score); // Highest priority first!
  }, [buildings, alerts, inspections, settings, search, tierFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="p-4 sm:p-5 rounded-md bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-[#0F172A]">
              Inspection Prioritisation Queue
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ranked facilities ordered by multi-factor urgency scoring for technician dispatch
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue by facility name, ID or zone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded outline-none focus:border-[#2563EB] focus:bg-white text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded text-xs font-medium text-[#0F172A] outline-none cursor-pointer"
          >
            <option value="ALL">All Inspection States</option>
            <option value="Needs Inspection">Needs Inspection (Unassigned / Open)</option>
            <option value="Assigned">Assigned</option>
            <option value="Inspecting">Inspecting</option>
            <option value="Repair Required">Repair Required</option>
            <option value="Verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Queue Ranked Table */}
      <div className="bg-white rounded-md border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>Facility & Zone</th>
                <th>Priority Score</th>
                <th>Est. Excess Flow</th>
                <th>Primary Reason & Recommended Action</th>
                <th>Assigned Inspector</th>
                <th>Status</th>
                <th className="text-right">Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {queueItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#64748B] text-xs">
                    No facilities match the active filter criteria.
                  </td>
                </tr>
              ) : (
                queueItems.map((item, index) => {
                  const rank = index + 1;
                  const isTopUrgency = rank <= 3 && item.score >= 60;

                  return (
                    <tr
                      key={item.building.id}
                      className={isTopUrgency ? 'bg-[#F8FAFC]' : ''}
                    >
                      {/* Rank */}
                      <td className="text-center font-mono tabular-nums text-xs font-medium text-[#64748B]">
                        #{rank}
                      </td>

                      {/* Facility */}
                      <td>
                        <button
                          onClick={() => {
                            setSelectedBuildingId(item.building.id);
                            setCurrentPage('buildings');
                          }}
                          className="font-medium text-[#0F172A] hover:text-[#2563EB] text-left cursor-pointer"
                        >
                          {item.building.name}
                        </button>
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          {item.building.id} • {item.building.zone} • {item.building.category}
                        </p>
                      </td>

                      {/* Priority Score */}
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSelectedBreakdown({
                                buildingName: item.building.name,
                                buildingId: item.building.id,
                                breakdown: item.breakdown,
                                priorityScore: item.score,
                              })
                            }
                            className={`font-mono tabular-nums text-xs font-semibold hover:underline flex items-center gap-1 ${
                              item.score >= 80
                                ? 'text-[#B54747]'
                                : item.score >= 60
                                ? 'text-[#B9822B]'
                                : 'text-[#2D6A4F]'
                            }`}
                            title="Audit calculation breakdown"
                          >
                            <span>{item.score}</span>
                            <Calculator className="w-3 h-3 text-[#64748B]" />
                          </button>

                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              item.tier === 'Critical'
                                ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                                : item.tier === 'High'
                                ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                                : item.tier === 'Medium'
                                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                            }`}
                          >
                            {item.tier}
                          </span>
                        </div>
                      </td>

                      {/* Est. Excess Flow */}
                      <td className="font-mono tabular-nums text-xs">
                        {item.potentialExcessDaily > 0 ? (
                          <div>
                            <span className="font-medium text-[#B9822B]">
                              +{Math.round(item.potentialExcessDaily).toLocaleString()} L/day
                            </span>
                            <p className="text-[10px] text-[#64748B]">
                              ≈ RM {((item.potentialExcessDaily / 1000) * settings.waterTariffRMPerM3).toFixed(2)}/day
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">Within baseline</span>
                        )}
                      </td>

                      {/* Primary Reason & Action */}
                      <td className="max-w-xs text-xs">
                        <p className="font-medium text-[#0F172A] line-clamp-1">
                          {item.urgencyReason}
                        </p>
                        <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                          {item.recommendedAction}
                        </p>
                      </td>

                      {/* Assigned Inspector */}
                      <td className="text-xs text-[#0F172A]">
                        {item.assignedInspector}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                            item.status === 'Verified'
                              ? 'bg-[#EFF6FF] text-[#2D6A4F] border-[#BFDBFE]'
                              : item.status.includes('Repair')
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : item.status === 'Inspecting'
                              ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                              : item.status === 'Assigned' || item.status === 'Open'
                              ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Breakdown Action */}
                      <td className="text-right">
                        <button
                          onClick={() =>
                            setSelectedBreakdown({
                              buildingName: item.building.name,
                              buildingId: item.building.id,
                              breakdown: item.breakdown,
                              priorityScore: item.score,
                            })
                          }
                          className="px-2.5 py-1 text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="Audit Score Breakdown"
                        >
                          <Calculator className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Score Breakdown</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Breakdown Modal */}
      {selectedBreakdown && (
        <ScoreBreakdownModal
          isOpen={!!selectedBreakdown}
          onClose={() => setSelectedBreakdown(null)}
          buildingName={selectedBreakdown.buildingName}
          buildingId={selectedBreakdown.buildingId}
          breakdown={selectedBreakdown.breakdown}
          priorityScore={selectedBreakdown.priorityScore}
        />
      )}
    </div>
  );
};
