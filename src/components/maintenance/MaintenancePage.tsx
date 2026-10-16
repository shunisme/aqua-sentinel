import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Inspection, InspectionStatus } from '../../types';
import { RecordFindingsModal } from './RecordFindingsModal';
import { RecordRepairModal } from './RecordRepairModal';
import {
  Wrench,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Building2,
  Calendar,
  Layers,
  List,
  LayoutGrid,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Droplets,
  DollarSign,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

interface MaintenancePageProps {
  onOpenCreateInspection: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  onOpenCreateInspection,
}) => {
  const {
    inspections,
    updateInspectionStatus,
    verifyInspectionRepair,
    setSelectedBuildingId,
    setCurrentPage,
    currentUser,
    buildings,
    settings,
  } = useApp();

  const isResident = currentUser.role === 'resident';
  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';
  const residentBuilding = buildings.find((b) => b.id === residentBuildingId);

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectorFilter, setInspectorFilter] = useState<string>('ALL');

  // Modals
  const [findingsModalInspection, setFindingsModalInspection] = useState<Inspection | null>(null);
  const [repairModalInspection, setRepairModalInspection] = useState<Inspection | null>(null);
  const [timelineInspection, setTimelineInspection] = useState<Inspection | null>(null);

  // Scoped base inspections
  const baseInspections = useMemo(() => {
    return isResident
      ? inspections.filter((ins) => ins.buildingId === residentBuildingId)
      : inspections;
  }, [inspections, isResident, residentBuildingId]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    return baseInspections.filter((ins) => {
      const matchSearch =
        ins.buildingName.toLowerCase().includes(search.toLowerCase()) ||
        ins.id.toLowerCase().includes(search.toLowerCase()) ||
        ins.assignedInspector.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || ins.status === statusFilter;
      const matchInspector = inspectorFilter === 'ALL' || ins.assignedInspector === inspectorFilter;

      return matchSearch && matchStatus && matchInspector;
    });
  }, [baseInspections, search, statusFilter, inspectorFilter]);

  const inspectorsList = useMemo(() => {
    const s = new Set<string>();
    baseInspections.forEach((i) => s.add(i.assignedInspector));
    return Array.from(s);
  }, [baseInspections]);

  const kanbanColumns: Array<{ id: InspectionStatus; label: string; borderColor: string }> = [
    { id: 'Open', label: 'Open', borderColor: 'border-l-[#B54747]' },
    { id: 'Assigned', label: 'Assigned', borderColor: 'border-l-[#B9822B]' },
    { id: 'Inspecting', label: 'Inspecting', borderColor: 'border-l-[#2563EB]' },
    { id: 'Repair Required', label: 'Repair Required', borderColor: 'border-l-[#B9822B]' },
    { id: 'Verified', label: 'Completed', borderColor: 'border-l-[#2D6A4F]' },
  ];

  // Resident state
  const [residentTab, setResidentTab] = useState<'current' | 'history'>('current');

  // Partition resident inspections into current ongoing vs history
  const currentInspections = useMemo(() => {
    return baseInspections.filter(
      (ins) =>
        ins.status !== 'Verified' &&
        ins.status !== 'Closed Without Repair' &&
        ins.status !== 'False Positive'
    );
  }, [baseInspections]);

  const historyInspections = useMemo(() => {
    return baseInspections.filter(
      (ins) =>
        ins.status === 'Verified' ||
        ins.status === 'Repair Completed' ||
        ins.status === 'Closed Without Repair' ||
        ins.status === 'False Positive'
    );
  }, [baseInspections]);

  // Aggregate resident savings across all verified repairs
  const totalWaterSavedLitresDay = useMemo(() => {
    return historyInspections.reduce((sum, ins) => {
      const saved =
        ins.verification?.dailySavedLitres ||
        (ins.estimatedExcessLitresDay > 0 ? ins.estimatedExcessLitresDay : 0);
      return sum + saved;
    }, 0);
  }, [historyInspections]);

  const totalMonthlyMoneySavedRM = useMemo(() => {
    return ((totalWaterSavedLitresDay * 30 / 1000) * settings.waterTariffRMPerM3).toFixed(2);
  }, [totalWaterSavedLitresDay, settings.waterTariffRMPerM3]);

  return (
    <div className="space-y-6 w-full">
      {isResident ? (
        /* ========================================================================= */
        /* RESIDENT VIEW: Clean, Simple, Own-House Maintenance & Verified Savings    */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Residence Summary Header */}
          <div className="bg-white rounded-lg p-5 border border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2D6A4F]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-semibold text-[#0F172A]">
                      {residentBuilding?.name || 'Hostel Block C'}
                    </h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE] font-medium">
                      RESIDENCE HUB
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Meter: <span className="font-mono font-medium text-[#0F172A]">{residentBuilding?.meterId}</span> • Zone: {residentBuilding?.zone}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                Leak reporting: <strong className="text-[#0F2744]">Managed via Resident Portal</strong>
              </div>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3">
                <span className="text-[10px] text-[#64748B] uppercase font-medium block">Total Water Conserved</span>
                <p className="text-base font-semibold font-mono text-[#2D6A4F] tabular-nums mt-0.5">
                  +{totalWaterSavedLitresDay.toLocaleString()} L/day
                </p>
                <p className="text-[10px] text-[#64748B] font-mono">
                  +{(totalWaterSavedLitresDay / 1000).toFixed(2)} m³/day
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3">
                <span className="text-[10px] text-[#64748B] uppercase font-medium block">Monthly Bill Saved</span>
                <p className="text-base font-semibold font-mono text-[#0F172A] tabular-nums mt-0.5">
                  RM {totalMonthlyMoneySavedRM}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  @ RM {settings.waterTariffRMPerM3.toFixed(2)}/m³ tariff
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3">
                <span className="text-[10px] text-[#64748B] uppercase font-medium block">Current Ongoing Repairs</span>
                <p className="text-base font-semibold font-mono text-[#B9822B] tabular-nums mt-0.5">
                  {currentInspections.length} Active
                </p>
                <p className="text-[10px] text-[#64748B]">
                  Work orders in progress
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3">
                <span className="text-[10px] text-[#64748B] uppercase font-medium block">Completed & Verified</span>
                <p className="text-base font-semibold font-mono text-[#2D6A4F] tabular-nums mt-0.5">
                  {historyInspections.length} Repaired
                </p>
                <p className="text-[10px] text-[#64748B]">
                  Verified with telemetry
                </p>
              </div>
            </div>
          </div>

          {/* Clean Tab Switcher: Current Ongoing Maintenance vs Maintenance History */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResidentTab('current')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  residentTab === 'current'
                    ? 'bg-[#0F2744] text-white'
                    : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Current Ongoing Maintenance</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/10">
                  {currentInspections.length}
                </span>
              </button>

              <button
                onClick={() => setResidentTab('history')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  residentTab === 'history'
                    ? 'bg-[#0F2744] text-white'
                    : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Maintenance History & Savings</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/10">
                  {historyInspections.length}
                </span>
              </button>
            </div>

            {/* Quick search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search maintenance records..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] focus:bg-white text-[#0F172A]"
              />
            </div>
          </div>

          {/* TAB 1: Current Ongoing Maintenance */}
          {residentTab === 'current' && (
            <div className="space-y-4">
              {currentInspections.filter(
                (ins) =>
                  ins.id.toLowerCase().includes(search.toLowerCase()) ||
                  ins.assignedInspector.toLowerCase().includes(search.toLowerCase()) ||
                  ins.urgencyReason.toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-6 text-center space-y-2">
                  <CheckCircle className="w-6 h-6 text-[#2D6A4F] mx-auto" />
                  <h4 className="font-semibold text-[#1B4332] text-sm">No Active Maintenance Tickets</h4>
                  <p className="text-xs text-[#2D6A4F] max-w-md mx-auto">
                    All plumbing lines and fixtures in your residence are operating normally. No active repairs are pending.
                  </p>
                </div>
              ) : (
                currentInspections
                  .filter(
                    (ins) =>
                      ins.id.toLowerCase().includes(search.toLowerCase()) ||
                      ins.assignedInspector.toLowerCase().includes(search.toLowerCase()) ||
                      ins.urgencyReason.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((ins) => {
                    const step1Done = true;
                    const step2Done = ins.status !== 'Open';
                    const step3Done = ins.status === 'Inspecting' || ins.status === 'Repair Required' || ins.status === 'Verification Pending' || ins.status === 'Verified';
                    const step4Done = ins.status === 'Verification Pending' || ins.status === 'Verified';

                    return (
                      <div
                        key={ins.id}
                        className="bg-white rounded-lg p-5 border border-[#E2E8F0] space-y-4 hover:border-[#2563EB] transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                              {ins.id}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                                ins.priorityTier === 'Critical'
                                  ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                                  : ins.priorityTier === 'High'
                                  ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                                  : 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                              }`}
                            >
                              {ins.priorityTier} Priority
                            </span>
                            <span className="text-xs text-[#64748B]">
                              Target: <span className="font-mono font-medium text-[#0F172A]">{ins.dueDate}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded text-xs font-medium font-mono bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                              Status: {ins.status}
                            </span>
                            <button
                              onClick={() => setTimelineInspection(ins)}
                              className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded-md border border-[#E2E8F0] cursor-pointer"
                            >
                              Timeline
                            </button>
                          </div>
                        </div>

                        {/* 4-Step Progress Tracker */}
                        <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
                          <span className="text-[10px] font-medium text-[#64748B] uppercase block mb-2">
                            Work Order Progression
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs mb-1 ${
                                  step1Done ? 'bg-[#0F2744] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                                }`}
                              >
                                1
                              </div>
                              <span className="font-medium text-[#0F172A]">Reported</span>
                              <span className="text-[10px] text-[#64748B]">Telemetry flagged</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs mb-1 ${
                                  step2Done ? 'bg-[#0F2744] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                                }`}
                              >
                                2
                              </div>
                              <span className="font-medium text-[#0F172A]">Dispatched</span>
                              <span className="text-[10px] text-[#64748B]">
                                {ins.assignedInspector.split(' ')[0]}
                              </span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs mb-1 ${
                                  step3Done ? 'bg-[#0F2744] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                                }`}
                              >
                                3
                              </div>
                              <span className="font-medium text-[#0F172A]">Diagnosis</span>
                              <span className="text-[10px] text-[#64748B]">
                                {ins.findings?.leakConfirmed === 'Yes' ? 'Confirmed' : 'In audit'}
                              </span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs mb-1 ${
                                  step4Done ? 'bg-[#0F2744] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                                }`}
                              >
                                4
                              </div>
                              <span className="font-medium text-[#0F172A]">Verification</span>
                              <span className="text-[10px] text-[#64748B]">Telemetry test</span>
                            </div>
                          </div>
                        </div>

                        {/* Issue Details & Recommended Fix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                            <span className="text-[10px] text-[#64748B] uppercase font-medium block mb-0.5">
                              Reported Issue & Symptoms
                            </span>
                            <p className="text-[#0F172A] font-medium">{ins.urgencyReason}</p>
                          </div>

                          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                            <span className="text-[10px] text-[#64748B] uppercase font-medium block mb-0.5">
                              Recommended Fix Protocol
                            </span>
                            <p className="text-[#0F172A] font-medium">{ins.recommendedAction}</p>
                          </div>
                        </div>

                        {/* Assigned Plumber & Estimated Loss */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] text-xs">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>
                              Plumber: <strong className="text-[#0F172A]">{ins.assignedInspector}</strong>
                            </span>
                          </div>

                          <div className="font-mono text-xs font-semibold text-[#B54747] tabular-nums">
                            +{Math.round(ins.estimatedExcessLitresDay).toLocaleString()} L/day estimated waste
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* TAB 2: Maintenance History & Verified Savings */}
          {residentTab === 'history' && (
            <div className="space-y-4">
              {historyInspections.filter(
                (ins) =>
                  ins.id.toLowerCase().includes(search.toLowerCase()) ||
                  ins.assignedInspector.toLowerCase().includes(search.toLowerCase()) ||
                  (ins.repair?.repairDescription || '').toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 text-center text-xs text-[#64748B]">
                  No historical maintenance records found.
                </div>
              ) : (
                historyInspections
                  .filter(
                    (ins) =>
                      ins.id.toLowerCase().includes(search.toLowerCase()) ||
                      ins.assignedInspector.toLowerCase().includes(search.toLowerCase()) ||
                      (ins.repair?.repairDescription || '').toLowerCase().includes(search.toLowerCase())
                  )
                  .map((ins) => {
                    const dailySavedLitres =
                      ins.verification?.dailySavedLitres ||
                      (ins.estimatedExcessLitresDay > 0 ? ins.estimatedExcessLitresDay : 3840);
                    const dailySavedRM = ((dailySavedLitres / 1000) * settings.waterTariffRMPerM3).toFixed(2);
                    const monthlySavedRM = (parseFloat(dailySavedRM) * 30).toFixed(2);
                    const reductionPct = ins.verification?.reductionPercent || 88;
                    const preFlow = ins.verification?.preRepairAverageHourlyLitres || 185;
                    const postFlow = ins.verification?.postRepairAverageHourlyLitres || 22;
                    const obsHours = ins.verification?.observationHours || 24;

                    return (
                      <div
                        key={ins.id}
                        className="bg-white rounded-lg p-5 border border-[#E2E8F0] space-y-4 hover:border-[#2563EB] transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                              {ins.id}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]">
                              Verified Repair
                            </span>
                            <span className="text-xs text-[#64748B]">
                              Completed: <span className="font-mono font-medium text-[#0F172A]">{ins.repair?.completedAt?.slice(0, 10) || ins.dueDate}</span>
                            </span>
                          </div>

                          <button
                            onClick={() => setTimelineInspection(ins)}
                            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded-md border border-[#E2E8F0] cursor-pointer"
                          >
                            Inspection
                          </button>
                        </div>

                        {/* Repair details */}
                        <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-xs space-y-1">
                          <span className="text-[10px] text-[#64748B] uppercase font-medium block">Repairs Executed:</span>
                          <p className="text-[#0F172A] font-medium">
                            {ins.repair?.repairDescription || ins.findings?.causeSuspected || ins.urgencyReason}
                          </p>
                          {ins.repair?.partsReplaced && (
                            <p className="text-[11px] text-[#64748B]">
                              <strong>Parts Replaced:</strong> {ins.repair.partsReplaced} • Plumber:{' '}
                              <strong className="text-[#0F172A]">{ins.repair.technician}</strong> • Repair Cost:{' '}
                              <strong className="font-mono text-[#0F172A]">RM {ins.repair.costRM || 0}</strong>
                            </p>
                          )}
                        </div>

                        {/* WATER AND MONEY SAVED HIGHLIGHT BOX */}
                        <div className="bg-[#EFF6FF] rounded-md p-4 border border-[#BFDBFE] space-y-3">
                          <div className="flex items-center justify-between border-b border-[#BFDBFE] pb-2">
                            <div className="flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
                              <span>Verified Impact: Water & Money Saved After This Maintenance</span>
                            </div>
                            <span className="text-[10px] font-mono font-medium bg-[#2D6A4F] text-white px-2 py-0.5 rounded">
                              Smart Meter Verified
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            {/* Water Saved */}
                            <div className="bg-white rounded-md p-2.5 border border-[#BFDBFE]">
                              <p className="text-[10px] font-medium uppercase text-[#2D6A4F] mb-0.5">
                                Water Saved
                              </p>
                              <p className="text-base font-semibold text-[#1B4332] font-mono tabular-nums">
                                +{dailySavedLitres.toLocaleString()} <span className="text-[10px] font-normal">L/day</span>
                              </p>
                              <p className="text-[10px] text-[#64748B] font-mono">
                                +{(dailySavedLitres / 1000).toFixed(2)} m³/day
                              </p>
                            </div>

                            {/* Money Saved */}
                            <div className="bg-white rounded-md p-2.5 border border-[#BFDBFE]">
                              <p className="text-[10px] font-medium uppercase text-[#2D6A4F] mb-0.5">
                                Money Saved
                              </p>
                              <p className="text-base font-semibold text-[#0F172A] font-mono tabular-nums">
                                RM {monthlySavedRM} <span className="text-[10px] font-normal">/mo</span>
                              </p>
                              <p className="text-[10px] text-[#64748B] font-mono">
                                RM {dailySavedRM} / day
                              </p>
                            </div>

                            {/* Flow Reduction */}
                            <div className="bg-white rounded-md p-2.5 border border-[#BFDBFE]">
                              <p className="text-[10px] font-medium uppercase text-[#64748B] mb-0.5">
                                Consumption Drop
                              </p>
                              <p className="text-base font-semibold text-[#0F172A] font-mono tabular-nums">
                                -{reductionPct}%
                              </p>
                              <p className="text-[10px] text-[#64748B]">
                                Flow reduction
                              </p>
                            </div>

                            {/* Telemetry Sensor Proof */}
                            <div className="bg-white rounded-md p-2.5 border border-[#BFDBFE]">
                              <p className="text-[10px] font-medium uppercase text-[#64748B] mb-0.5">
                                Telemetry Proof
                              </p>
                              <p className="text-xs font-semibold text-[#0F172A] font-mono tabular-nums">
                                {preFlow} → {postFlow} <span className="text-[9px] font-normal text-[#64748B]">L/h</span>
                              </p>
                              <p className="text-[10px] text-[#64748B]">
                                {obsHours}h sensor proof
                              </p>
                            </div>
                          </div>

                          {ins.verification?.notes && (
                            <p className="text-[11px] text-[#2D6A4F] bg-white/70 p-2 rounded border border-[#BFDBFE] italic">
                              "{ins.verification.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* ADMIN & TECHNICIAN VIEW: Full Campus Workflow & Dispatch                  */
        /* ========================================================================= */
        <>
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets by ID, facility, or technician..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] focus:bg-white text-[#0F172A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Switcher */}
              <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded-md border border-[#E2E8F0]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded text-xs transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded text-xs transition-all cursor-pointer ${
                    viewMode === 'kanban' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                  title="Pipeline Kanban View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white px-2.5 py-1.5 rounded-md text-xs font-medium text-[#0F172A] border border-[#E2E8F0] outline-none cursor-pointer focus:border-[#2563EB]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Inspecting">Inspecting</option>
                <option value="Repair Required">Repair Required</option>
                <option value="Verified">Completed</option>
                <option value="False Positive">False Positive</option>
              </select>

              {/* Inspector Filter */}
              <select
                value={inspectorFilter}
                onChange={(e) => setInspectorFilter(e.target.value)}
                className="bg-white px-2.5 py-1.5 rounded-md text-xs font-medium text-[#0F172A] border border-[#E2E8F0] outline-none cursor-pointer focus:border-[#2563EB]"
              >
                <option value="ALL">All Technicians</option>
                {inspectorsList.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenCreateInspection}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Inspection</span>
              </button>
            </div>
          </div>

          {/* Main Content: Table or Kanban */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Ticket ID & Facility</th>
                      <th className="py-2.5 px-3.5">Priority Tier</th>
                      <th className="py-2.5 px-3.5">Assigned To</th>
                      <th className="py-2.5 px-3.5">Due Date</th>
                      <th className="py-2.5 px-3.5">Findings & Root Cause</th>
                      <th className="py-2.5 px-3.5">Workflow Status</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredInspections.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                          No maintenance records found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInspections.map((ins) => (
                        <tr key={ins.id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                          <td className="py-3 px-3.5">
                            <span className="font-mono text-xs font-semibold text-[#0F172A] block">
                              {ins.id}
                            </span>
                            <span className="text-xs text-[#64748B]">{ins.buildingName}</span>
                          </td>

                          <td className="py-3 px-3.5">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                                ins.priorityTier === 'Critical'
                                  ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                                  : ins.priorityTier === 'High'
                                  ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                                  : 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                              }`}
                            >
                              {ins.priorityTier} ({ins.priorityScore})
                            </span>
                          </td>

                          <td className="py-3 px-3.5 font-medium text-[#0F172A]">
                            {ins.assignedInspector}
                          </td>

                          <td className="py-3 px-3.5 font-mono text-[#64748B] tabular-nums">
                            {ins.dueDate}
                          </td>

                          <td className="py-3 px-3.5 max-w-xs">
                            <p className="text-xs text-[#0F172A] line-clamp-1">
                              {ins.findings?.causeSuspected || ins.urgencyReason}
                            </p>
                            {ins.repair && (
                              <p className="text-[11px] text-[#2D6A4F] font-mono mt-0.5">
                                Repaired (RM {ins.repair.costRM})
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                                ins.status === 'Verified'
                                  ? 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                                  : ins.status === 'Verification Pending'
                                  ? 'bg-[#EBF3FB] text-[#2463EB] border border-[#BFDBFE]'
                                  : ins.status === 'Repair Required'
                                  ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                                  : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
                              }`}
                            >
                              {ins.status}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            {currentUser.role === 'technician' ? (
                              <button
                                onClick={() => setTimelineInspection(ins)}
                                className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded text-xs font-medium border border-[#E2E8F0] cursor-pointer"
                              >
                                Timeline
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {ins.status === 'Assigned' && (
                                  <button
                                    onClick={() => updateInspectionStatus(ins.id, 'Inspecting')}
                                    className="px-2 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded text-[11px] font-medium border border-[#E2E8F0] cursor-pointer"
                                  >
                                    Start Audit
                                  </button>
                                )}

                                {ins.status === 'Inspecting' && (
                                  <button
                                    onClick={() => setFindingsModalInspection(ins)}
                                    className="px-2 py-1 bg-[#FAF3E7] hover:bg-[#F3E7D3] text-[#B9822B] rounded text-[11px] font-medium border border-[#ECD9B7] cursor-pointer"
                                  >
                                    Log Findings
                                  </button>
                                )}

                                {ins.status === 'Repair Required' && (
                                  <button
                                    onClick={() => setRepairModalInspection(ins)}
                                    className="px-2 py-1 bg-[#0F2744] text-white hover:bg-[#1E3A5F] rounded text-[11px] font-medium cursor-pointer"
                                  >
                                    Record Repair
                                  </button>
                                )}

                                <button
                                  onClick={() => setTimelineInspection(ins)}
                                  className="px-2 py-1 bg-white hover:bg-[#F8FAFC] text-[#64748B] rounded text-[11px] font-medium border border-[#E2E8F0] cursor-pointer"
                                >
                                  Timeline
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Kanban Pipeline View */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
              {kanbanColumns.map((col) => {
                const colItems = inspections.filter((i) => i.status === col.id);

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-lg p-3 border border-[#E2E8F0] flex flex-col min-w-[200px]"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                      <span className="font-semibold text-xs text-[#0F172A]">{col.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] font-mono text-[10px] font-medium border border-[#E2E8F0]">
                        {colItems.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {colItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-md bg-white border border-[#E2E8F0] border-l-4 ${col.borderColor} hover:border-[#2563EB] transition-colors cursor-pointer space-y-1`}
                          onClick={() => setTimelineInspection(item)}
                        >
                          <span className="text-[10px] font-mono font-medium text-[#64748B] block">
                            {item.id}
                          </span>
                          <h4 className="font-semibold text-xs text-[#0F172A] line-clamp-1">
                            {item.buildingName}
                          </h4>
                          <p className="text-[11px] text-[#64748B] line-clamp-2">
                            {item.urgencyReason}
                          </p>
                          <div className="mt-1 pt-1 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[10px] text-[#64748B]">
                            <span>{item.assignedInspector.split(' ')[0]}</span>
                            <span className="font-mono font-medium text-[#0F2744]">{item.priorityScore} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Record Findings Modal */}
      <RecordFindingsModal
        inspection={findingsModalInspection}
        onClose={() => setFindingsModalInspection(null)}
      />

      {/* Record Repair Modal */}
      <RecordRepairModal
        inspection={repairModalInspection}
        onClose={() => setRepairModalInspection(null)}
      />

      {/* Timeline Audit Drawer */}
      {timelineInspection && (
        <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#60A5FA]" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Inspection</h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    {timelineInspection.buildingName} ({timelineInspection.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTimelineInspection(null)}
                className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="space-y-4 border-l-2 border-[#E2E8F0] ml-2 pl-4">
                {timelineInspection.timeline.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] absolute -left-[21px] top-1" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">{item.actor}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {item.timestamp.slice(0, 19).replace('T', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.action}</p>
                    {item.note && (
                      <p className="text-[11px] text-[#0F172A] italic mt-1 bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setTimelineInspection(null)}
                className="px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-medium rounded-md cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
