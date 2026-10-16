import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnomalyAlert } from '../../types';
import {
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  PlusCircle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AlertDetailModalProps {
  alert: AnomalyAlert | null;
  onClose: () => void;
  onOpenCreateInspection: (buildingId: string, alertId: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onOpenCreateInspection,
}) => {
  const {
    acknowledgeAlert,
    resolveAlert,
    markAlertFalsePositive,
    readings,
    settings,
  } = useApp();

  const [falsePositiveReasonInput, setFalsePositiveReasonInput] = useState('');
  const [showFalsePositiveForm, setShowFalsePositiveForm] = useState(false);
  const [resolveNotesInput, setResolveNotesInput] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  if (!alert) return null;

  // Telemetry chart around alert time
  const anomalyTime = new Date(alert.detectedAt).getTime();
  const windowMillis = 36 * 3600 * 1000; // ±36 hours

  const anomalyChartData = readings
    .filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return r.buildingId === alert.buildingId && Math.abs(t - anomalyTime) <= windowMillis;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      time: `${r.timestamp.slice(5, 10)} ${r.timestamp.slice(11, 16)}`,
      actual: r.consumptionLitres,
      expected: r.expectedLitres,
      isAnomalous: r.isAnomalous,
    }));

  const handleMarkFalsePositive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!falsePositiveReasonInput.trim()) return;
    markAlertFalsePositive(alert.id, falsePositiveReasonInput.trim());
    setShowFalsePositiveForm(false);
    onClose();
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    resolveAlert(alert.id, resolveNotesInput.trim() || 'Resolved upon facility investigation.');
    setShowResolveForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-md shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F2744] text-white flex items-start justify-between border-b border-[#1E3A5F]">
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center text-white flex-shrink-0 mt-0.5 border ${
                alert.severity === 'Critical'
                  ? 'bg-[#B54747] border-[#8A2E2E]'
                  : alert.severity === 'High'
                  ? 'bg-[#B9822B] border-[#8C621F]'
                  : 'bg-[#2563EB] border-[#25584A]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#94A3B8] bg-[#0A1B30] px-1.5 py-0.2 rounded border border-[#235249]">
                  {alert.id}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    alert.severity === 'Critical'
                      ? 'bg-[#B54747]/20 text-[#FBECEC] border-[#B54747]'
                      : alert.severity === 'High'
                      ? 'bg-[#B9822B]/20 text-[#FAF3E7] border-[#B9822B]'
                      : 'bg-[#2563EB]/20 text-[#EFF6FF] border-[#2563EB]'
                  }`}
                >
                  {alert.severity} Severity
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0A1B30] text-[#94A3B8] border border-[#235249]">
                  Evidence: {alert.evidenceStrength}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mt-1">
                {alert.buildingName}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Rule: <span className="text-white font-medium">{alert.ruleName}</span> • Detected at{' '}
                <span className="font-mono">{alert.detectedAt.replace('T', ' ').slice(0, 19)}</span>
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Observed Flow</span>
              <span className="text-lg font-mono tabular-nums font-semibold text-[#0F172A]">
                {Math.round(alert.actualLitres).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748B] ml-1">L/hr</span>
            </div>
            <div className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Baseline Expected</span>
              <span className="text-lg font-mono tabular-nums font-semibold text-[#0F172A]">
                {Math.round(alert.expectedLitres).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748B] ml-1">L/hr</span>
            </div>
            <div className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Excess Flow Rate</span>
              <span className="text-lg font-mono tabular-nums font-semibold text-[#B9822B]">
                +{Math.round(Math.max(0, alert.actualLitres - alert.expectedLitres)).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748B] ml-1">L/hr</span>
            </div>
            <div className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[11px] text-[#64748B] block">Est. Daily Impact</span>
              <span className="text-lg font-mono tabular-nums font-semibold text-[#B54747]">
                +{Math.round(alert.estimatedExcessLitres).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#64748B] ml-1">L/day</span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] space-y-1">
            <h4 className="font-semibold text-xs text-[#0F172A] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Telemetry Diagnostic Finding</span>
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {alert.explanation}
            </p>
          </div>

          {/* Time Series Context Chart */}
          <div className="p-4 rounded border border-[#E2E8F0] bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#0F172A]">
                Telemetry Window (±36 Hours Around Event)
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-[#0F172A]">
                  <span className="w-2 h-2 rounded-sm bg-[#2563EB]" />
                  Actual
                </span>
                <span className="flex items-center gap-1 text-[#64748B]">
                  <span className="w-2 h-0.5 bg-[#94A3B8]" />
                  Expected
                </span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={anomalyChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F2744',
                      border: '1px solid #1E3A5F',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area type="monotone" dataKey="expected" stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3" fill="#F8FAFC" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={1.5} fill="#EFF6FF" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forms for False Positive / Resolve if open */}
          {showFalsePositiveForm && (
            <form onSubmit={handleMarkFalsePositive} className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
              <label className="font-semibold text-xs text-[#0F172A] block">
                Provide False Positive Reason (Required for Audit Trail):
              </label>
              <textarea
                value={falsePositiveReasonInput}
                onChange={(e) => setFalsePositiveReasonInput(e.target.value)}
                placeholder="e.g. Scheduled cooling tower flushing, landscape irrigation override..."
                className="w-full p-2 text-xs border border-[#E2E8F0] rounded outline-none focus:border-[#0F2744] bg-white"
                rows={2}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFalsePositiveForm(false)}
                  className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-medium text-white bg-[#0F2744] hover:bg-[#1E3A5F] rounded"
                >
                  Confirm False Positive
                </button>
              </div>
            </form>
          )}

          {showResolveForm && (
            <form onSubmit={handleResolve} className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
              <label className="font-semibold text-xs text-[#0F172A] block">
                Resolution Notes & Corrective Action Taken:
              </label>
              <textarea
                value={resolveNotesInput}
                onChange={(e) => setResolveNotesInput(e.target.value)}
                placeholder="e.g. Replaced leaking cistern valve on 3rd floor..."
                className="w-full p-2 text-xs border border-[#E2E8F0] rounded outline-none focus:border-[#0F2744] bg-white"
                rows={2}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveForm(false)}
                  className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-medium text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded"
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {alert.status === 'New' && (
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-medium rounded transition-colors cursor-pointer"
              >
                Acknowledge Alert
              </button>
            )}

            {alert.status !== 'False Positive' && alert.status !== 'Resolved' && (
              <>
                <button
                  onClick={() => setShowFalsePositiveForm(true)}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded transition-colors cursor-pointer"
                >
                  Mark False Positive
                </button>
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2D6A4F] hover:bg-[#D8F0E4] font-medium rounded transition-colors cursor-pointer"
                >
                  Resolve Alert
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenCreateInspection(alert.buildingId, alert.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Dispatch Inspection</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
