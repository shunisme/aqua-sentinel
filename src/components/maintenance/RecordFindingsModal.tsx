import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Inspection, InspectionFindings } from '../../types';
import { X, SearchCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface RecordFindingsModalProps {
  inspection: Inspection | null;
  onClose: () => void;
}

export const RecordFindingsModal: React.FC<RecordFindingsModalProps> = ({
  inspection,
  onClose,
}) => {
  const { recordInspectionFindings } = useApp();

  const [causeSuspected, setCauseSuspected] = useState('');
  const [leakConfirmed, setLeakConfirmed] = useState<'Yes' | 'No' | 'Inconclusive'>('Yes');
  const [notes, setNotes] = useState('');
  const [inspector, setInspector] = useState(inspection?.assignedInspector || 'On-Site Plumber');

  if (!inspection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!causeSuspected.trim()) return;

    const findings: InspectionFindings = {
      causeSuspected: causeSuspected.trim(),
      leakConfirmed,
      notes: notes.trim(),
      inspectedAt: new Date().toISOString(),
      inspector,
    };

    recordInspectionFindings(inspection.id, findings);
    onClose();
  };

  const commonCauses = [
    'Faulty toilet cistern flapper valves leaking continuously',
    'Underground distribution line hairline fracture',
    'Rooftop cooling tower make-up float valve stuck open',
    'Automated irrigation timer bypass / valve malfunction',
    'Urinal flushometer diaphragm failure',
    'Corroded copper pipe joint in service shaft',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <SearchCheck className="w-4 h-4 text-[#60A5FA]" />
            <div>
              <h3 className="font-semibold text-sm text-white">Record Inspection Findings</h3>
              <p className="text-[11px] text-[#94A3B8]">
                {inspection.buildingName} ({inspection.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Telemetry Context Box */}
          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#64748B]">Telemetry Trigger:</span>
              <span className="font-mono text-[#B54747] font-semibold tabular-nums">
                +{Math.round(inspection.estimatedExcessLitresDay).toLocaleString()} L/day excess
              </span>
            </div>
            <p className="text-[#0F172A] font-medium">{inspection.urgencyReason}</p>
          </div>

          {/* Leak Confirmed Radio Group */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Physical Leak Confirmed? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLeakConfirmed('Yes')}
                className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                  leakConfirmed === 'Yes'
                    ? 'bg-[#EFF6FF] border-[#2D6A4F] text-[#2D6A4F]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                Yes, Leak Found
              </button>
              <button
                type="button"
                onClick={() => setLeakConfirmed('No')}
                className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                  leakConfirmed === 'No'
                    ? 'bg-[#FBECEC] border-[#B54747] text-[#B54747]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                No Defect (False Flag)
              </button>
              <button
                type="button"
                onClick={() => setLeakConfirmed('Inconclusive')}
                className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                  leakConfirmed === 'Inconclusive'
                    ? 'bg-[#FAF3E7] border-[#B9822B] text-[#B9822B]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                Inconclusive
              </button>
            </div>
          </div>

          {/* Root Cause Input & Quick Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Diagnosed Root Cause *
            </label>
            <input
              type="text"
              required
              value={causeSuspected}
              onChange={(e) => setCauseSuspected(e.target.value)}
              placeholder="e.g. 2nd floor male washroom flush valve jammed open"
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
            <div className="mt-2 space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-medium">Quick Select Common Causes:</span>
              <div className="flex flex-wrap gap-1">
                {commonCauses.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCauseSuspected(c)}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Inspecting Plumber
              </label>
              <input
                type="text"
                required
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Next Recommendation
              </label>
              <div className="text-xs px-3 py-2 border border-[#E2E8F0] rounded-md bg-[#F8FAFC] text-[#64748B] truncate">
                {leakConfirmed === 'Yes' ? 'Schedule Repair Work Order' : 'Close Ticket or Remonitor'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Field Observations & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe access conditions, valve isolate status, or required replacement parts..."
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md cursor-pointer transition-colors"
            >
              Save Findings & Advance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
