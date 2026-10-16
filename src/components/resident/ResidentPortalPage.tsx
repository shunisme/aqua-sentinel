import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ResidentIssueType } from '../../types';
import {
  CheckCircle2,
  Droplet,
  Send,
  Clock,
  Wrench,
  Building2,
} from 'lucide-react';

const COMMON_ISSUES: Array<{ label: string; value: ResidentIssueType; icon: string }> = [
  { label: 'Running Toilet', value: 'Running Toilet Cistern', icon: '🚽' },
  { label: 'Dripping Tap', value: 'Dripping Sink Tap', icon: '🚰' },
  { label: 'Shower Leak', value: 'Leaking Shower Pipe', icon: '🚿' },
  { label: 'Ceiling Seep', value: 'Water Seeping from Ceiling', icon: '💧' },
  { label: 'Pipe Breach', value: 'Outdoor Pipe Breach', icon: '⚠️' },
  { label: 'Other Defect', value: 'Other', icon: '🔧' },
];

export const ResidentPortalPage: React.FC = () => {
  const {
    buildings,
    residentReports,
    submitResidentReport,
    currentUser,
    inspections,
  } = useApp();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    currentUser.assignedBuildingId || 'BLD-102'
  );

  // Sync selectedBuildingId with current user's assigned house
  useEffect(() => {
    if (currentUser.assignedBuildingId) {
      setSelectedBuildingId(currentUser.assignedBuildingId);
    }
  }, [currentUser.assignedBuildingId]);

  // Leak report form state (editable reporter name as requested)
  const [reporterName, setReporterName] = useState(currentUser.name || 'Nur Aisyah');
  const [floor, setFloor] = useState(3);
  const [location, setLocation] = useState('');
  const [issueType, setIssueType] = useState<ResidentIssueType>('Running Toilet Cistern');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('High');
  const [reportSuccess, setReportSuccess] = useState(false);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];

  // Filter resident reports for this building
  const buildingReports = residentReports.filter(
    (r) => r.buildingId === selectedBuildingId
  );

  // Inspections / Work orders for this building
  const buildingInspections = useMemo(() => {
    return inspections.filter((ins) => ins.buildingId === selectedBuildingId);
  }, [inspections, selectedBuildingId]);

  // In-progress maintenance for this residence
  const activeWorkOrders = useMemo(() => {
    return buildingInspections.filter(
      (ins) =>
        ins.status !== 'Verified' &&
        ins.status !== 'Closed Without Repair' &&
        ins.status !== 'False Positive'
    );
  }, [buildingInspections]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    submitResidentReport({
      buildingId: selectedBuilding.id,
      buildingName: selectedBuilding.name,
      floor,
      location: location.trim(),
      issueType,
      description: description.trim(),
      reporterName: reporterName.trim() || currentUser.name || 'Resident',
      urgency,
    });

    setLocation('');
    setDescription('');
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header with Residence Selector */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
            Resident Water Portal
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Report water leaks and track ongoing plumbing maintenance for your residence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#64748B]" />
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="text-xs font-medium bg-white text-[#0F172A] px-3 py-2 rounded-md border border-[#E2E8F0] outline-none cursor-pointer focus:border-[#2563EB]"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. PROMINENT REPORT WATER LEAK SECTION (BIGGEST PART) */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border-2 border-[#2563EB]/40 shadow-xs space-y-5">
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Droplet className="w-6 h-6 fill-[#2563EB]/20" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <span>Report a Dripping Tap or Water Leak</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Notice a toilet cistern running, tap dripping, or dampness? Submit a ticket directly to facilities plumbing dispatch.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium">
            Fast Track Dispatch
          </span>
        </div>

        {reportSuccess && (
          <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] rounded-md text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
            <span>
              Ticket successfully dispatched. Campus plumbing repair worker has been alerted for {selectedBuilding.name}.
            </span>
          </div>
        )}

        {/* Quick Issue Selector Chips */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wider text-[11px]">
            1. Select Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {COMMON_ISSUES.map((issue) => {
              const isSelected = issueType === issue.value;
              return (
                <button
                  type="button"
                  key={issue.value}
                  onClick={() => setIssueType(issue.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-semibold ring-1 ring-[#2563EB]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#0F172A]'
                  }`}
                >
                  <span className="text-xl">{issue.icon}</span>
                  <span className="text-xs">{issue.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Form */}
        <form onSubmit={handleReportSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Reporter Name (Editable as requested) */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Reported By (Your Name) *
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Enter reporter name"
                className="w-full text-xs px-3.5 py-2.5 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white font-medium text-[#0F172A]"
              />
            </div>

            {/* Floor / Level */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Floor / Level *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(parseInt(e.target.value) || 1)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white font-medium text-[#0F172A] cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((f) => (
                  <option key={f} value={f}>
                    Level {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Observed Severity
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white font-medium text-[#0F172A] cursor-pointer"
              >
                <option value="Low">Low (Slow or intermittent drip)</option>
                <option value="Medium">Medium (Steady flow / dripping)</option>
                <option value="High">High (Continuous running)</option>
                <option value="Emergency">Emergency (Active flooding)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Specific Location in Residence *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Level 3 Washroom - Cubicle 2 or Pantry Left Sink"
              className="w-full text-xs px-3.5 py-2.5 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Diagnostic Details / Observations
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms, e.g. continuous hiss all night, loose valve handle, water pooling on tile floor..."
              className="w-full text-xs px-3.5 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Submit Leak Report</span>
            </button>
          </div>
        </form>
      </div>



      {/* Grid: Ongoing Maintenance & Reports History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ongoing Plumbing Repairs in this Residence */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Current Ongoing Maintenance ({activeWorkOrders.length})</span>
            </h2>
            <span className="text-[11px] text-[#64748B]">{selectedBuilding.name}</span>
          </div>

          {activeWorkOrders.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-md bg-[#F8FAFC]">
              No active maintenance tickets pending in your residence.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {activeWorkOrders.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#0F172A]">
                        {ins.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          ins.priorityTier === 'Critical'
                            ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                            : 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                        }`}
                      >
                        {ins.priorityTier}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-[#0F172A] border border-[#E2E8F0]">
                      {ins.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#0F172A] font-medium">
                    {ins.urgencyReason}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]/60">
                    <span>Plumber: <strong className="text-[#0F172A] font-medium">{ins.assignedInspector}</strong></span>
                    <span className="font-mono">Target: {ins.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occupant Submissions Log */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Logged Reports ({buildingReports.length})</span>
            </h2>
          </div>

          {buildingReports.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-md bg-[#F8FAFC]">
              No reports submitted yet for this facility.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {buildingReports.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-[#0F172A]">
                      {r.issueType} — Level {r.floor}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {r.location} • By {r.reporterName} • <span className="font-mono">{r.reportedAt.slice(0, 10)}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                      r.status === 'Resolved'
                        ? 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                        : r.status === 'Assigned'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        : 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
