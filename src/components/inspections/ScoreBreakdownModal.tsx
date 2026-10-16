import React from 'react';
import { ScoreBreakdown } from '../../types';
import { X, Calculator, Info, Scale } from 'lucide-react';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingName: string;
  buildingId: string;
  breakdown: ScoreBreakdown | null;
  priorityScore: number;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  buildingName,
  buildingId,
  breakdown,
  priorityScore,
}) => {
  if (!isOpen || !breakdown) return null;

  const excessContribution = Math.round(breakdown.excessScore * breakdown.excessWeight);
  const persistenceContribution = Math.round(breakdown.persistenceScore * breakdown.persistenceWeight);
  const severityContribution = Math.round(breakdown.severityScore * breakdown.severityWeight);
  const evidenceContribution = Math.round(breakdown.evidenceScore * breakdown.evidenceWeight);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-md shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0A1B30] border border-[#235249] flex items-center justify-center text-[#63C79A]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Priority Score Audit</h3>
              <p className="text-xs text-[#94A3B8] font-mono">
                {buildingName} ({buildingId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E4841] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5">
          {/* Big Score Card */}
          <div className="p-4 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
                Computed Urgency Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-mono tabular-nums font-semibold ${
                    priorityScore >= 80
                      ? 'text-[#B54747]'
                      : priorityScore >= 60
                      ? 'text-[#B9822B]'
                      : 'text-[#2D6A4F]'
                  }`}
                >
                  {priorityScore}
                </span>
                <span className="text-xs text-[#64748B] font-mono">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                  priorityScore >= 80
                    ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                    : priorityScore >= 60
                    ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                    : 'bg-[#EFF6FF] text-[#2D6A4F] border-[#BFDBFE]'
                }`}
              >
                {priorityScore >= 80
                  ? 'Critical Urgency'
                  : priorityScore >= 60
                  ? 'High Urgency'
                  : priorityScore >= 35
                  ? 'Medium Urgency'
                  : 'Low Urgency'}
              </span>
              <p className="text-[11px] text-[#64748B] mt-1 font-mono">Multi-factor Weighted</p>
            </div>
          </div>

          {/* Contributing Factors Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wide">
              <Scale className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Factor Contributions</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Factor 1: Excess Volume */}
              <div className="p-3 rounded border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#0F172A]">
                    Excess Consumption Volume (Weight: {Math.round(breakdown.excessWeight * 100)}%)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    +{excessContribution} pts
                  </span>
                </div>
                <div className="w-full bg-[#F8FAFC] rounded h-1.5 overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="bg-[#0F2744] h-full"
                    style={{ width: `${breakdown.excessScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Raw score: {breakdown.excessScore}/100 • Evaluated against facility baseline
                </p>
              </div>

              {/* Factor 2: Persistence */}
              <div className="p-3 rounded border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#0F172A]">
                    Anomaly Persistence & Duration (Weight: {Math.round(breakdown.persistenceWeight * 100)}%)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    +{persistenceContribution} pts
                  </span>
                </div>
                <div className="w-full bg-[#F8FAFC] rounded h-1.5 overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="bg-[#2563EB] h-full"
                    style={{ width: `${breakdown.persistenceScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Raw score: {breakdown.persistenceScore}/100 • Evaluated by hours of uninterrupted abnormal flow
                </p>
              </div>

              {/* Factor 3: Severity */}
              <div className="p-3 rounded border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#0F172A]">
                    Alert Severity Level (Weight: {Math.round(breakdown.severityWeight * 100)}%)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    +{severityContribution} pts
                  </span>
                </div>
                <div className="w-full bg-[#F8FAFC] rounded h-1.5 overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="bg-[#B9822B] h-full"
                    style={{ width: `${breakdown.severityScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Raw score: {breakdown.severityScore}/100 • Determined by detection rule risk tier
                </p>
              </div>

              {/* Factor 4: Evidence Strength */}
              <div className="p-3 rounded border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#0F172A]">
                    Evidence Strength (Weight: {Math.round(breakdown.evidenceWeight * 100)}%)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    +{evidenceContribution} pts
                  </span>
                </div>
                <div className="w-full bg-[#F8FAFC] rounded h-1.5 overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="bg-[#2D6A4F] h-full"
                    style={{ width: `${breakdown.evidenceScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Raw score: {breakdown.evidenceScore}/100 • Multiple concurring meter anomaly alerts
                </p>
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2 text-xs text-[#64748B]">
            <Info className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {breakdown.explanation}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-medium rounded transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
