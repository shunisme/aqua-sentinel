import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Inspection } from '../../types';
import { RecordFindingsModal } from '../maintenance/RecordFindingsModal';
import { RecordRepairModal } from '../maintenance/RecordRepairModal';
import { HandcraftedEmptyState } from '../common/HandcraftedEmptyState';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  CheckSquare,
  FileText,
  XCircle,
} from 'lucide-react';

interface TechnicianDashboardPageProps {
  onOpenCreateInspection?: (buildingId?: string) => void;
}

export const TechnicianDashboardPage: React.FC<TechnicianDashboardPageProps> = () => {
  const {
    inspections,
    updateInspectionStatus,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my_jobs' | 'all_jobs'>('my_jobs');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInspectionForFindings, setSelectedInspectionForFindings] = useState<Inspection | null>(null);
  const [selectedInspectionForRepair, setSelectedInspectionForRepair] = useState<Inspection | null>(null);

  // My assigned jobs
  const myJobs = useMemo(() => {
    return inspections
      .filter((i) => {
        if (activeTab === 'my_jobs') {
          return (
            i.assignedInspector.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
            i.assignedInspector.includes('Ahmad')
          );
        }
        return true;
      })
      .filter((i) => {
        return statusFilter === 'ALL' || i.status === statusFilter;
      });
  }, [inspections, activeTab, currentUser.name, statusFilter]);

  const urgentCount = inspections.filter((i) => i.priorityTier === 'Critical' && i.status !== 'Verified').length;
  const inProgressCount = inspections.filter((i) => i.status === 'Inspecting' || i.status === 'Assigned').length;
  const completedCount = inspections.filter((i) => i.status === 'Verified').length;

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
              Repair Worker Hub
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium">
              FIELD WORK ORDERS
            </span>
          </div>
        </div>

        {/* 3 Metric Tiles */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F8FAFC] px-3.5 py-2 rounded-md border border-[#E2E8F0] text-center min-w-[90px]">
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Active Jobs</span>
            <span className="text-lg font-mono font-semibold text-[#0F172A] tabular-nums">{inProgressCount}</span>
          </div>
          <div className="bg-[#F8FAFC] px-3.5 py-2 rounded-md border border-[#E2E8F0] text-center min-w-[90px]">
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Critical Tier</span>
            <span className="text-lg font-mono font-semibold text-[#B54747] tabular-nums">{urgentCount}</span>
          </div>
          <div className="bg-[#F8FAFC] px-3.5 py-2 rounded-md border border-[#E2E8F0] text-center min-w-[90px]">
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Completed</span>
            <span className="text-lg font-mono font-semibold text-[#2D6A4F] tabular-nums">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('my_jobs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'my_jobs'
                ? 'bg-[#0F2744] text-white'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('all_jobs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'all_jobs'
                ? 'bg-[#0F2744] text-white'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            All tickets
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white px-2.5 py-1.5 rounded-md font-medium text-[#0F172A] border border-[#E2E8F0] outline-none cursor-pointer focus:border-[#2563EB]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Inspecting">Inspecting</option>
            <option value="Repair Required">Repair Required</option>
            <option value="Verified">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
          {myJobs.length === 0 ? (
            <HandcraftedEmptyState
              title="All assigned field tickets are up to date"
              description="No unresolved plumbing work orders or scheduled inspections pending in your current queue."
            />
          ) : (
            myJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-[#2563EB]/40 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
                      {job.id}
                    </span>
                    <h2 className="text-sm font-semibold text-[#0F172A]">
                      {job.buildingName}
                    </h2>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                        job.priorityTier === 'Critical'
                          ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                          : job.priorityTier === 'High'
                          ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                          : 'bg-[#EFF6FF] text-[#2D6A4F] border-[#BFDBFE]'
                      }`}
                    >
                      {job.priorityTier} Priority (Score: {job.priorityScore})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border font-medium ${
                        job.status === 'Verified'
                          ? 'bg-[#EFF6FF] text-[#2D6A4F] border-[#BFDBFE]'
                          : job.status === 'Inspecting'
                          ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                          : job.status === 'Repair Required'
                          ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {job.status === 'Verified' ? 'Completed & Reported' : job.status}
                    </span>
                    <span className="text-[#64748B] flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {job.dueDate}
                    </span>
                  </div>
                </div>

                {/* Problem & Urgency Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase block">
                      Current Reported Problem
                    </span>
                    <p className="text-[#0F172A] font-medium leading-relaxed">
                      {job.urgencyReason}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase block">
                      Recommended Engineering Action
                    </span>
                    <p className="text-[#0F172A] font-medium leading-relaxed">
                      {job.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Findings If Logged */}
                {job.findings && (
                  <div className="p-3 bg-[#EFF6FF] rounded-md border border-[#BFDBFE] text-xs space-y-1">
                    <span className="font-semibold text-[#1E40AF] block">
                      Field Diagnostics Logged by {job.findings.inspector}:
                    </span>
                    <p className="text-[#1E3A5F]">
                      <strong>Confirmed:</strong> {job.findings.leakConfirmed} • <strong>Cause:</strong> {job.findings.causeSuspected}
                    </p>
                    {job.findings.notes && (
                      <p className="text-[#1E3A5F] italic">"{job.findings.notes}"</p>
                    )}
                  </div>
                )}

                {/* Repair Summary If Completed */}
                {job.repair && (
                  <div className="p-3 bg-[#F0FDF4] rounded-md border border-[#BBF7D0] text-xs space-y-1">
                    <span className="font-semibold text-[#166534] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>Repair Completed & Reported to Admin by {job.repair.technician}</span>
                    </span>
                    <p className="text-[#14532D]">
                      <strong>Work Done:</strong> {job.repair.repairDescription}
                    </p>
                    <p className="text-[#14532D]">
                      <strong>Parts:</strong> {job.repair.partsReplaced || 'N/A'} • <strong>Cost:</strong> RM {job.repair.costRM}
                    </p>
                  </div>
                )}

                {/* Repair Worker Action Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8F0]">
                  {job.status === 'Assigned' && (
                    <button
                      onClick={() => updateInspectionStatus(job.id, 'Inspecting')}
                      className="px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Start On-Site Inspection
                    </button>
                  )}

                  {job.status !== 'Verified' && (
                    <>
                      <button
                        onClick={() => setSelectedInspectionForFindings(job)}
                        className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Update Problem / Notes</span>
                      </button>

                      <button
                        onClick={() => updateInspectionStatus(job.id, 'Repair Required', 'Escalated: Specialized parts or contractor required')}
                        className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#B54747] border border-[#FECACA] text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Mark as Unresolved / Escalated</span>
                      </button>

                      <button
                        onClick={() => setSelectedInspectionForRepair(job)}
                        className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Mark as Solved & Report to Admin</span>
                      </button>
                    </>
                  )}

                  {job.status === 'Verified' && (
                    <span className="text-xs font-medium text-[#2D6A4F] flex items-center gap-1.5 font-mono py-1">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>Completed & Reported to Admin</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      {/* Record Findings Modal */}
      <RecordFindingsModal
        inspection={selectedInspectionForFindings}
        onClose={() => setSelectedInspectionForFindings(null)}
      />

      {/* Record Repair Modal */}
      <RecordRepairModal
        inspection={selectedInspectionForRepair}
        onClose={() => setSelectedInspectionForRepair(null)}
      />
    </div>
  );
};
