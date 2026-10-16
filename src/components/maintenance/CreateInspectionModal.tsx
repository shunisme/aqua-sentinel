import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ClipboardList, Building2, UserCheck, Calendar } from 'lucide-react';

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBuildingId?: string | null;
  defaultAlertId?: string | null;
}

export const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  isOpen,
  onClose,
  defaultBuildingId,
  defaultAlertId,
}) => {
  const { buildings, alerts, createInspection } = useApp();

  const [buildingId, setBuildingId] = useState(defaultBuildingId || (buildings[0]?.id || ''));
  const [alertId, setAlertId] = useState(defaultAlertId || '');
  const [assignedInspector, setAssignedInspector] = useState('Ahmad Faiz (Senior Plumber)');
  const [dueDate, setDueDate] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');

  useEffect(() => {
    if (defaultBuildingId) setBuildingId(defaultBuildingId);
    if (defaultAlertId) {
      setAlertId(defaultAlertId);
      const alert = alerts.find((a) => a.id === defaultAlertId);
      if (alert) {
        setUrgencyReason(alert.explanation);
        setRecommendedAction(alert.recommendedAction);
      }
    } else {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
      setDueDate(tomorrow);
    }
  }, [defaultBuildingId, defaultAlertId, alerts, isOpen]);

  if (!isOpen) return null;

  const inspectors = [
    'Ahmad Faiz (Senior Plumber)',
    'Tan Wei Ming (HVAC & Water Specialist)',
    'K. Rajan (Plumbing Specialist)',
    'Mohd Rizal (Grounds Specialist)',
    'Nurul Huda (Facility Auditor)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) return;

    createInspection({
      buildingId,
      alertId: alertId || undefined,
      assignedInspector,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      urgencyReason: urgencyReason || 'Scheduled on-site plumbing audit.',
      recommendedAction: recommendedAction || 'Inspect primary distribution manifolds and isolation valves.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="font-semibold text-sm text-white">Dispatch Inspection Work Order</h3>
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
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Campus Facility *
            </label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A] cursor-pointer"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id}) — {b.zone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Assigned Plumber / Specialist *
              </label>
              <select
                value={assignedInspector}
                onChange={(e) => setAssignedInspector(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A] cursor-pointer"
              >
                {inspectors.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Target Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono text-[#0F172A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Symptoms / Anomaly Description
            </label>
            <textarea
              rows={2}
              value={urgencyReason}
              onChange={(e) => setUrgencyReason(e.target.value)}
              placeholder="e.g. Continuous nocturnal minimum flow exceeding 185 L/hr between 01:00 and 05:00."
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Recommended Inspection Protocol
            </label>
            <textarea
              rows={2}
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value)}
              placeholder="e.g. Perform acoustic acoustic survey on secondary distribution headers; isolate hostel wing riser valves sequentially."
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
              Dispatch Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
