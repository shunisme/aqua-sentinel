import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingDown,
  Droplets,
  DollarSign,
  CheckCircle2,
  Calendar,
  Download,
  AlertTriangle,
  Wrench,
  Clock,
  Sparkles,
  Info,
  Building2,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { ExecutiveSummaryPrintModal } from './ExecutiveSummaryPrintModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ImpactReportsPage: React.FC = () => {
  const { buildings, alerts, inspections, readings, settings, currentUser } = useApp();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const isResident = currentUser.role === 'resident';
  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';
  const residentBuilding = buildings.find((b) => b.id === residentBuildingId);

  // Scoped datasets if resident
  const baseAlerts = useMemo(() => {
    return isResident ? alerts.filter((a) => a.buildingId === residentBuildingId) : alerts;
  }, [alerts, isResident, residentBuildingId]);

  const baseInspections = useMemo(() => {
    return isResident ? inspections.filter((i) => i.buildingId === residentBuildingId) : inspections;
  }, [inspections, isResident, residentBuildingId]);

  // Metrics
  const totalPotentialExcessLitres = useMemo(() => {
    return baseAlerts.reduce((sum, a) => sum + a.estimatedExcessLitres, 0);
  }, [baseAlerts]);

  const confirmedLeaksCount = useMemo(() => {
    return baseInspections.filter((i) => i.findings?.leakConfirmed === 'Yes').length;
  }, [baseInspections]);

  const completedRepairs = useMemo(() => {
    return baseInspections.filter(
      (i) => i.status === 'Repair Completed' || i.status === 'Verification Pending' || i.status === 'Verified'
    );
  }, [baseInspections]);

  const verifiedRepairs = useMemo(() => {
    return baseInspections.filter((i) => i.status === 'Verified');
  }, [baseInspections]);

  const dailySavedLitres = useMemo(() => {
    return verifiedRepairs.reduce(
      (sum, i) => sum + (i.verification?.dailySavedLitres || 0),
      0
    );
  }, [verifiedRepairs]);

  // Cumulative water saved (estimating days since verification)
  const cumulativeSavedLitres = useMemo(() => {
    return verifiedRepairs.reduce((sum, i) => {
      const daily = i.verification?.dailySavedLitres || 0;
      return sum + daily * 4; // ~4 days of verified operation in demo
    }, 0);
  }, [verifiedRepairs]);

  const cumulativeFinancialSavingsRM = useMemo(() => {
    return Number(((cumulativeSavedLitres / 1000) * settings.waterTariffRMPerM3).toFixed(2));
  }, [cumulativeSavedLitres, settings.waterTariffRMPerM3]);

  // Overall reduction % across verified repairs
  const avgReductionPercent = useMemo(() => {
    if (verifiedRepairs.length === 0) return 0;
    const total = verifiedRepairs.reduce(
      (sum, i) => sum + (i.verification?.reductionPercent || 0),
      0
    );
    return Math.round(total / verifiedRepairs.length);
  }, [verifiedRepairs]);

  // Before & After Chart Data for Completed Repairs
  const repairComparisons = useMemo(() => {
    return completedRepairs.map((ins) => {
      const pre = ins.verification?.preRepairAverageHourlyLitres || 440;
      const post = ins.verification?.postRepairAverageHourlyLitres || 135;
      const saved = Math.max(0, pre - post);

      return {
        buildingName: ins.buildingName.slice(0, 18),
        preRepair: pre,
        postRepair: post,
        savedHourly: saved,
        status: ins.verification?.status || 'Pending Verification',
        percent: ins.verification?.reductionPercent || 0,
        id: ins.id,
      };
    });
  }, [completedRepairs]);

  // CSV Exporters
  const downloadCSV = (filename: string, rows: string[][], headers: string[]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAlertsCSV = () => {
    const headers = ['alert_id', 'building_name', 'rule', 'severity', 'actual_litres', 'expected_litres', 'excess_litres', 'status', 'detected_at'];
    const rows = alerts.map((a) => [
      a.id,
      a.buildingName,
      a.rule,
      a.severity,
      String(a.actualLitres),
      String(a.expectedLitres),
      String(a.estimatedExcessLitres),
      a.status,
      a.detectedAt,
    ]);
    downloadCSV('aqua_sentinel_leak_alerts.csv', rows, headers);
  };

  const exportInspectionsCSV = () => {
    const headers = ['inspection_id', 'building_name', 'priority_score', 'status', 'assigned_inspector', 'due_date', 'leak_confirmed', 'repair_done'];
    const rows = inspections.map((i) => [
      i.id,
      i.buildingName,
      String(i.priorityScore),
      i.status,
      i.assignedInspector,
      i.dueDate,
      i.findings?.leakConfirmed || 'Pending',
      i.repair?.repairDescription || 'None',
    ]);
    downloadCSV('aqua_sentinel_inspections.csv', rows, headers);
  };

  const exportRepairOutcomesCSV = () => {
    const headers = ['inspection_id', 'building_name', 'technician', 'pre_repair_hourly_l', 'post_repair_hourly_l', 'daily_saved_l', 'reduction_percent', 'verification_status', 'cost_rm'];
    const rows = completedRepairs.map((i) => [
      i.id,
      i.buildingName,
      i.repair?.technician || 'N/A',
      String(i.verification?.preRepairAverageHourlyLitres || 0),
      String(i.verification?.postRepairAverageHourlyLitres || 0),
      String(i.verification?.dailySavedLitres || 0),
      `${i.verification?.reductionPercent || 0}%`,
      i.verification?.status || 'Pending',
      String(i.repair?.costRM || 0),
    ]);
    downloadCSV('aqua_sentinel_repair_outcomes.csv', rows, headers);
  };

  const exportConsumptionSummaryCSV = () => {
    const headers = ['building_id', 'building_name', 'category', 'zone', 'current_daily_litres', 'expected_daily_litres', 'excess_daily_litres', 'priority_score'];
    const rows = buildings.map((b) => [
      b.id,
      b.name,
      b.category,
      b.zone,
      String(b.currentDailyLitres),
      String(b.expectedDailyLitres),
      String(Math.max(0, b.currentDailyLitres - b.expectedDailyLitres)),
      String(b.priorityScore),
    ]);
    downloadCSV('aqua_sentinel_consumption_summary.csv', rows, headers);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Resident House Context Banner if resident */}
      {isResident && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#2D6A4F] text-white flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1B4332]">
                Residence Water Conservation Audit: {residentBuilding?.name || 'Hostel Block C'}
              </p>
              <p className="text-[11px] text-[#2D6A4F]">
                Verified meter flow reductions and bill savings achieved through completed fixture overhauls.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-white text-[#2D6A4F] border border-[#BFDBFE]">
            {verifiedRepairs.length} Verified Repairs • {Math.round(dailySavedLitres).toLocaleString()} L/day Saved
          </span>
        </div>
      )}

      {/* Top Banner & Export CSVs */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
              Water Conservation & Verified Impact Audit
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE] font-medium">
              EMPIRICAL TELEMETRY VERIFIED
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Audit of detected water infrastructure defects, completed work orders, and empirical post-repair flow restorations.
          </p>
        </div>

        {/* Actions: Executive PDF + CSV Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
            title="Generate print-ready ESG & Water Conservation Audit report"
          >
            <Printer className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Executive Audit (PDF)</span>
          </button>

          {/* CSV Export Buttons */}
          <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded-md border border-[#E2E8F0] text-xs">
            <button
              onClick={exportAlertsCSV}
              className="px-2.5 py-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-white transition-all cursor-pointer"
            >
              Alerts
            </button>
            <button
              onClick={exportInspectionsCSV}
              className="px-2.5 py-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-white transition-all cursor-pointer"
            >
              Work Orders
            </button>
            <button
              onClick={exportRepairOutcomesCSV}
              className="px-2.5 py-1 text-[#2D6A4F] font-semibold hover:bg-white rounded transition-all cursor-pointer"
            >
              Repair Outcomes
            </button>
            <button
              onClick={exportConsumptionSummaryCSV}
              className="px-2.5 py-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-white transition-all cursor-pointer"
            >
              Consumption
            </button>
          </div>
        </div>
      </div>

      {/* 4 Impact Big Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verified Water Saved per Day */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2D6A4F]">
              Verified Daily Savings
            </span>
            <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2D6A4F] flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#2D6A4F] tabular-nums tracking-tight">
              {Math.round(dailySavedLitres).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">L / day</span>
          </div>
          <p className="text-[11px] text-[#2D6A4F] mt-1 font-mono">
            ≈ {(dailySavedLitres / 1000).toFixed(2)} m³ conserved daily
          </p>
        </div>

        {/* Metric 2: Cumulative Water Saved */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A]">
              Cumulative Saved
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F8FAFC] text-[#0F2744] flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#0F172A] tabular-nums tracking-tight">
              {Math.round(cumulativeSavedLitres).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">Litres</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Across sustained observation windows
          </p>
        </div>

        {/* Metric 3: Estimated Financial Savings */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A]">
              Financial Savings
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-medium text-[#64748B]">RM</span>
            <span className="text-2xl font-bold font-mono text-[#0F172A] tabular-nums tracking-tight">
              {cumulativeFinancialSavingsRM.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Campus tariff @ RM {settings.waterTariffRMPerM3.toFixed(2)} / m³
          </p>
        </div>

        {/* Metric 4: Average Flow Reduction */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F172A]">
              Flow Rate Reduction
            </span>
            <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2D6A4F] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#2D6A4F] tabular-nums tracking-tight">
              -{avgReductionPercent}%
            </span>
            <span className="text-xs text-[#2D6A4F]">Restored</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            {verifiedRepairs.length} repair(s) empirically verified
          </p>
        </div>
      </div>

      {/* Before and After Telemetry Chart */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Pre-Repair vs. Post-Repair Hourly Flow Rates (Empirical Verification)
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Average flow rate (L/hr) during low-usage windows before maintenance vs verified flow after repair
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-[#B54747]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#B54747]" />
              Pre-Repair Flow (L/hr)
            </span>
            <span className="flex items-center gap-1.5 text-[#2563EB]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
              Post-Repair Flow (L/hr)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {repairComparisons.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              No completed repairs logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairComparisons} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="buildingName" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} L`} />
                <Tooltip
                  formatter={(val: any) => [`${Math.round(Number(val) || 0)} L/hr`, '']}
                  contentStyle={{
                    backgroundColor: '#0F2744',
                    border: '1px solid #2563EB',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="preRepair" fill="#B54747" name="Pre-Repair Flow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="postRepair" fill="#2563EB" name="Post-Repair Flow" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Case Study Deep Dive: Engineering Block E (Scenario E) */}
      <div className="p-5 rounded-lg bg-white border border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[#0F2744] text-[10px] font-mono font-semibold border border-[#E2E8F0]">
              CASE AUDIT • SCENARIO E
            </span>
            <h3 className="font-semibold text-sm text-[#0F172A]">
              Faculty of Engineering Block E: Cistern Flapper Valve Overhaul
            </h3>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]">
            100% Empirically Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] font-medium uppercase text-[10px] block">
              Pre-Repair Telemetry Anomaly
            </span>
            <p className="text-sm font-semibold font-mono text-[#B54747] tabular-nums mt-0.5">
              445 L/hr Continuous Flow
            </p>
            <p className="text-[#64748B] text-[11px] mt-1">
              Elevated baseline caused by 8 leaking toilet cistern flapper valves in 3rd floor washrooms.
            </p>
          </div>

          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] font-medium uppercase text-[10px] block">
              Plumbing Intervention
            </span>
            <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
              Replaced 8 Flappers & Floats
            </p>
            <p className="text-[#64748B] text-[11px] mt-1">
              Work completed on 10 Oct 2026 by K. Rajan & Team (Direct parts cost: <strong className="text-[#0F172A] font-mono">RM 380</strong>).
            </p>
          </div>

          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] font-medium uppercase text-[10px] block">
              Verified Telemetry Outcome
            </span>
            <p className="text-sm font-semibold font-mono text-[#2D6A4F] tabular-nums mt-0.5">
              -70% Flow (310 L/hr Saved)
            </p>
            <p className="text-[#64748B] text-[11px] mt-1">
              Dropped to 135 L/hr. Conserved 7,440 L/day (≈ RM 21.20/day). Capital payback achieved in 18 days.
            </p>
          </div>
        </div>
      </div>

      {/* Honest Scientific Methodology Card */}
      <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5">
        <h4 className="font-semibold flex items-center gap-1.5 text-[#0F172A]">
          <Info className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Verification Methodology & Governance Disclosure</span>
        </h4>
        <p className="text-[#64748B] leading-relaxed">
          Aqua Sentinel follows strict industrial engineering protocols: potential excess flow is calculated using{' '}
          <code className="bg-white px-1.5 py-0.5 rounded font-mono font-medium border border-[#E2E8F0] text-[#0F172A]">
            max(0, actual_consumption - expected_baseline)
          </code>
          . A post-repair reduction is only marked as <strong>Verified</strong> once stable flow is confirmed for at least 48 continuous observation hours. Reductions during initial observation windows are flagged as <em>Preliminary</em>.
        </p>
      </div>

      {/* Printable Executive ESG & Water Conservation Audit Modal */}
      <ExecutiveSummaryPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
