import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  Droplets,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface ExecutiveSummaryPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveSummaryPrintModal: React.FC<ExecutiveSummaryPrintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { buildings, alerts, inspections, settings } = useApp();

  if (!isOpen) return null;

  // Filter verified repairs
  const verifiedRepairs = inspections.filter((i) => i.status === 'Verified');
  const completedRepairs = inspections.filter(
    (i) => i.status === 'Repair Completed' || i.status === 'Verification Pending' || i.status === 'Verified'
  );

  const dailySavedLitres = verifiedRepairs.reduce(
    (sum, i) => sum + (i.verification?.dailySavedLitres || 0),
    0
  );

  const dailySavedRM = (dailySavedLitres / 1000) * settings.waterTariffRMPerM3;
  const monthlySavedRM = dailySavedRM * 30;
  const annualSavedRM = monthlySavedRM * 12;

  const totalCampusExcessLitres = alerts
    .filter((a) => a.status !== 'Resolved' && a.status !== 'False Positive')
    .reduce((sum, a) => sum + a.estimatedExcessLitres, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[95vh] print:fixed print:inset-0 print:m-0 print:p-0 print:max-w-none print:rounded-none print:shadow-none print:border-none">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F] print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Printer className="w-4 h-4 text-[#60A5FA]" />
            <span>Printable Executive ESG & Water Conservation Audit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#2563EB] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-[#0F172A] print:p-10 font-sans">
          {/* Official Letterhead */}
          <div className="border-b-2 border-[#0F2744] pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#0F2744] text-white flex items-center justify-center font-bold text-sm">
                  AS
                </div>
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-tight text-[#0F172A]">
                    Aqua Sentinel
                  </h1>
                  <p className="text-[10px] uppercase font-semibold tracking-widest text-[#2563EB]">
                    Smart Water Infrastructure & Inspection Platform
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-1.5">
                Universiti Malaya • Sustainability & Campus Water Operations Division
              </p>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <span className="font-mono font-semibold text-[#0F172A] text-xs block">
                AUDIT-2026-Q4-UM
              </span>
              <span className="text-[#64748B]">Date: October 14, 2026</span>
              <span className="text-[#64748B] block">Status: Verified Official Audit</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A]">
              Executive Water Anomaly & Financial Conservation Audit
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Automated empirical audit synthesized from 20 monitored campus facilities, 336 hourly telemetry readings, 
              and post-repair smart meter verification.
            </p>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Daily Water Conserved
              </span>
              <p className="text-lg font-bold text-[#2D6A4F] mt-1 font-mono tabular-nums">
                +{Math.round(dailySavedLitres).toLocaleString()} <span className="text-xs font-normal">L/day</span>
              </p>
              <span className="text-[10px] text-[#64748B] block mt-0.5">
                ≈ {(dailySavedLitres / 1000).toFixed(2)} m³ saved daily
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Monthly Utility Savings
              </span>
              <p className="text-lg font-bold text-[#0F172A] mt-1 font-mono tabular-nums">
                RM {monthlySavedRM.toFixed(2)}
              </p>
              <span className="text-[10px] text-[#64748B] block mt-0.5">
                ≈ RM {annualSavedRM.toFixed(0)} projected annually
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Verified Repaired Leaks
              </span>
              <p className="text-lg font-bold text-[#0F172A] mt-1 font-mono tabular-nums">
                {verifiedRepairs.length} <span className="text-xs font-normal">facilities</span>
              </p>
              <span className="text-[10px] text-[#2D6A4F] block mt-0.5">
                48-hour telemetry confirmed
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Remaining Excess Risk
              </span>
              <p className="text-lg font-bold text-[#B9822B] mt-1 font-mono tabular-nums">
                +{Math.round(totalCampusExcessLitres).toLocaleString()} <span className="text-xs font-normal">L/day</span>
              </p>
              <span className="text-[10px] text-[#64748B] block mt-0.5">
                Under active inspection triage
              </span>
            </div>
          </div>

          {/* Verified Repair Outcomes Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-2">
              Empirical Post-Repair Telemetry Verification Table
            </h3>
            <div className="border border-[#E2E8F0] rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-2.5">Facility Name</th>
                    <th className="p-2.5">Meter ID</th>
                    <th className="p-2.5">Pre-Repair Flow</th>
                    <th className="p-2.5">Post-Repair Flow</th>
                    <th className="p-2.5">Saved Litres / Day</th>
                    <th className="p-2.5 text-right">Monthly Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                  {verifiedRepairs.map((ins) => {
                    const building = buildings.find((b) => b.id === ins.buildingId);
                    const pre = ins.verification?.preRepairAverageHourlyLitres || 0;
                    const post = ins.verification?.postRepairAverageHourlyLitres || 0;
                    const saved = ins.verification?.dailySavedLitres || 0;
                    const rm = ((saved / 1000) * settings.waterTariffRMPerM3) * 30;

                    return (
                      <tr key={ins.id} className="hover:bg-[#F8FAFC]">
                        <td className="p-2.5 font-sans font-medium text-[#0F172A]">
                          {ins.buildingName}
                        </td>
                        <td className="p-2.5 text-[#64748B]">{building?.meterId || 'MTR-Main'}</td>
                        <td className="p-2.5 text-[#B54747] font-semibold">{pre} L/h</td>
                        <td className="p-2.5 text-[#2D6A4F] font-semibold">{post} L/h</td>
                        <td className="p-2.5 text-[#0F172A] font-semibold">+{saved.toLocaleString()} L</td>
                        <td className="p-2.5 text-right font-semibold text-[#0F172A]">
                          RM {rm.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ESG Alignment Badges */}
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              United Nations Sustainable Development Goals (SDG) Alignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-[#2563EB] text-white font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  6
                </span>
                <div>
                  <p className="font-semibold text-[#0F172A]">SDG 6.4: Water-Use Efficiency</p>
                  <p className="text-[11px] text-[#64748B]">
                    Substantially increases water-use efficiency by eliminating continuous nocturnal leakage.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-[#B9822B] text-white font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  11
                </span>
                <div>
                  <p className="font-semibold text-[#0F172A]">SDG 11.6: Sustainable Campus Operations</p>
                  <p className="text-[11px] text-[#64748B]">
                    Reduces university ecological footprint through empirical infrastructure management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Sign-off Block */}
          <div className="pt-6 border-t border-[#E2E8F0] grid grid-cols-2 gap-8 text-xs text-[#64748B]">
            <div>
              <p className="font-semibold text-[#0F172A]">Prepared & Certified By:</p>
              <p className="mt-4 font-serif text-[#0F172A] text-sm italic">Eng. Faizul Rahman</p>
              <p className="text-[10px]">Lead Campus Facility Operations Director</p>
              <p className="text-[10px]">Universiti Malaya</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#0F172A]">Verified By Maintenance Team:</p>
              <p className="mt-4 font-serif text-[#0F172A] text-sm italic">Ahmad Faiz</p>
              <p className="text-[10px]">Senior Field Technician & Plumbing Operations</p>
              <p className="text-[10px]">Universiti Malaya</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
