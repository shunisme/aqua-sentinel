import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Inspection, RepairRecord } from '../../types';
import { X, Wrench, CheckCircle2, DollarSign } from 'lucide-react';

interface RecordRepairModalProps {
  inspection: Inspection | null;
  onClose: () => void;
}

export const RecordRepairModal: React.FC<RecordRepairModalProps> = ({
  inspection,
  onClose,
}) => {
  const { recordRepair } = useApp();

  const [repairDescription, setRepairDescription] = useState('');
  const [technician, setTechnician] = useState(inspection?.assignedInspector || 'K. Rajan & Team');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [costRM, setCostRM] = useState(250);

  if (!inspection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairDescription.trim()) return;

    const repair: RepairRecord = {
      repairDescription: repairDescription.trim(),
      completedAt: new Date().toISOString(),
      technician,
      partsReplaced: partsReplaced.trim(),
      costRM,
    };

    recordRepair(inspection.id, repair);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#60A5FA]" />
            <div>
              <h3 className="font-semibold text-sm text-white">Record Completed Plumbing Repair</h3>
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
          {/* Diagnostic Context */}
          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-xs space-y-1">
            <span className="font-medium text-[#64748B] uppercase text-[10px] block">Diagnosed Problem:</span>
            <p className="text-[#0F172A] font-semibold">
              {inspection.findings?.causeSuspected || inspection.urgencyReason}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Plumbing Work Executed *
            </label>
            <textarea
              required
              rows={2}
              value={repairDescription}
              onChange={(e) => setRepairDescription(e.target.value)}
              placeholder="e.g. Replaced leaking cistern flapper valves and calibrated float arm on Level 2 & 3 washrooms."
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Parts Replaced / Materials Consumed
            </label>
            <input
              type="text"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g. 2x Fluidmaster 2-inch flapper, 1x 15mm isolation ball valve"
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Field Plumber / Contractor
              </label>
              <input
                type="text"
                required
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Direct Repair Cost (RM)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={costRM}
                onChange={(e) => setCostRM(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-md text-xs text-[#166534] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <span>
              Submitting records this issue as <strong>Completed</strong>, restores building baseline, and reports resolution directly to administration.
            </span>
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
              Mark as Solved & Report to Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
