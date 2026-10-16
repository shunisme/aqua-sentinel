import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Building } from '../../types';
import {
  X,
  Building2,
  Activity,
  AlertTriangle,
  ClipboardList,
  Wrench,
  TrendingDown,
  Gauge,
  Calendar,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  PlusCircle,
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

interface BuildingDetailModalProps {
  building: Building | null;
  onClose: () => void;
  onOpenCreateInspection: (buildingId: string) => void;
  onEditBuilding: (building: Building) => void;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  building,
  onClose,
  onOpenCreateInspection,
  onEditBuilding,
}) => {
  const { readings, alerts, inspections, settings, setSelectedAlertId, setCurrentPage } = useApp();

  if (!building) return null;

  // Filter building readings (last 48 hours for detail view)
  const buildingReadings = useMemo(() => {
    return readings
      .filter((r) => r.buildingId === building.id)
      .slice(-48)
      .map((r) => ({
        time: r.timestamp.slice(11, 16), // HH:mm
        date: r.timestamp.slice(5, 10),
        actual: r.consumptionLitres,
        expected: r.expectedLitres,
        excess: Math.max(0, r.consumptionLitres - r.expectedLitres),
        isAnomalous: r.isAnomalous,
      }));
  }, [readings, building.id]);

  const buildingAlerts = alerts.filter((a) => a.buildingId === building.id);
  const buildingInspections = inspections.filter((i) => i.buildingId === building.id);

  const potentialExcessDaily = Math.max(
    0,
    building.currentDailyLitres - building.expectedDailyLitres
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F2744] text-white flex items-start justify-between border-b border-[#1E3A5F]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#1E3A5F] border border-[#2563EB] flex items-center justify-center text-[#60A5FA] mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#1E3A5F] text-[#60A5FA] border border-[#2563EB]">
                  {building.id}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#1E3A5F] text-white/80">
                  {building.category === 'Hostel' ? 'Residential' : building.category}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                    building.anomalyStatus === 'Suspected Leak'
                      ? 'bg-[#B54747] text-white'
                      : building.anomalyStatus === 'High Flow'
                      ? 'bg-[#B9822B] text-white'
                      : 'bg-[#2D6A4F] text-white'
                  }`}
                >
                  {building.anomalyStatus}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white mt-1">{building.name}</h2>
              <p className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>{building.zone}</span>
                <span>•</span>
                <Gauge className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span className="font-mono">Meter: {building.meterId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditBuilding(building)}
              className="px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#2563EB] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Edit Details
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-medium block">Daily Inflow</span>
              <p className="text-base font-semibold font-mono text-[#0F172A] tabular-nums mt-0.5">
                {Math.round(building.currentDailyLitres).toLocaleString()} L/day
              </p>
              <span className="text-[10px] text-[#64748B] font-mono">
                Baseline: {Math.round(building.expectedDailyLitres).toLocaleString()} L
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-medium block">Potential Waste Delta</span>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${
                  potentialExcessDaily > 0 ? 'text-[#B54747]' : 'text-[#2D6A4F]'
                }`}
              >
                {potentialExcessDaily > 0
                  ? `+${Math.round(potentialExcessDaily).toLocaleString()} L`
                  : '0 L (Nominal)'}
              </p>
              <span className="text-[10px] text-[#64748B] font-mono">
                Est. ~RM {((potentialExcessDaily / 1000) * settings.waterTariffRMPerM3).toFixed(2)}/day
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-medium block">Priority Score</span>
              <p
                className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${
                  building.priorityScore >= 80
                    ? 'text-[#B54747]'
                    : building.priorityScore >= 60
                    ? 'text-[#B9822B]'
                    : 'text-[#2D6A4F]'
                }`}
              >
                {building.priorityScore} / 100
              </p>
              <span className="text-[10px] text-[#64748B]">
                Status: {building.inspectionStatus}
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-medium block">Active Alerts</span>
              <p className="text-base font-semibold font-mono text-[#0F172A] tabular-nums mt-0.5">
                {buildingAlerts.filter((a) => a.status !== 'Resolved').length}{' '}
                <span className="text-xs font-normal text-[#64748B]">unresolved</span>
              </p>
              <span className="text-[10px] text-[#64748B]">
                {buildingAlerts.length} lifetime recorded
              </span>
            </div>
          </div>

          {/* Telemetry Chart */}
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                  48-Hour Hourly Telemetry Profile
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Metered flow vs expected diurnal baseline (Litres/hour)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#2563EB] font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
                  Actual Flow
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2.5 h-0.5 bg-[#94A3B8]" />
                  Expected Baseline
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buildingReadings} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
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
                  <Area
                    type="monotone"
                    dataKey="expected"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    fill="#F8FAFC"
                    strokeDasharray="3 3"
                    name="Expected Baseline"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="#EFF6FF"
                    fillOpacity={0.6}
                    name="Actual Flow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Alerts List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B9822B]" />
                <span>Detection Alerts ({buildingAlerts.length})</span>
              </h3>
            </div>

            {buildingAlerts.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-md bg-[#F8FAFC]">
                No active or historical alerts for this building.
              </div>
            ) : (
              <div className="space-y-2">
                {buildingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                            alert.severity === 'Critical'
                              ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                              : alert.severity === 'High'
                              ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                              : 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          {alert.ruleName}
                        </span>
                        <span className="text-[11px] text-[#64748B] font-mono">
                          {alert.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{alert.explanation}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          alert.status === 'Resolved'
                            ? 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                            : alert.status === 'False Positive'
                            ? 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                            : 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                        }`}
                      >
                        {alert.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAlertId(alert.id);
                          setCurrentPage('alerts');
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer text-[#0F172A]"
                      >
                        View Alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Inspection Tickets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Inspection & Repair History ({buildingInspections.length})</span>
              </h3>
              <button
                onClick={() => onOpenCreateInspection(building.id)}
                className="text-xs font-medium text-[#0F2744] hover:text-[#2563EB] flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Inspection</span>
              </button>
            </div>

            {buildingInspections.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-md bg-[#F8FAFC]">
                No inspection tickets recorded for this building yet.
              </div>
            ) : (
              <div className="space-y-2">
                {buildingInspections.map((ins) => (
                  <div
                    key={ins.id}
                    className="p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0F172A]">
                          {ins.id}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          Technician: {ins.assignedInspector}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          ins.status === 'Verified'
                            ? 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                            : ins.status.includes('Repair')
                            ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                            : 'bg-white text-[#0F172A] border border-[#E2E8F0]'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#0F172A]">{ins.urgencyReason}</p>

                    {ins.findings && (
                      <div className="p-2 bg-white rounded border border-[#E2E8F0] text-xs">
                        <span className="font-medium text-[#0F172A]">Findings: </span>
                        <span className="text-[#64748B]">{ins.findings.causeSuspected}</span>
                        <span className="text-[#0F172A] font-mono ml-2">
                          (Leak Confirmed: {ins.findings.leakConfirmed})
                        </span>
                      </div>
                    )}

                    {ins.repair && (
                      <div className="p-2 bg-[#EFF6FF] rounded border border-[#BFDBFE] text-xs text-[#1B4332]">
                        <span className="font-medium">Repair Executed: </span>
                        <span>{ins.repair.repairDescription}</span>
                        <span className="font-mono font-semibold ml-2">
                          (Cost: RM {ins.repair.costRM})
                        </span>
                      </div>
                    )}

                    {ins.verification && (
                      <div className="p-2 bg-[#EFF6FF] rounded border border-[#BFDBFE] text-xs text-[#1B4332] font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F] flex-shrink-0" />
                        <span>
                          Telemetry Verified: {ins.verification.reductionPercent}% reduction confirmed ({ins.verification.dailySavedLitres} L/day saved).
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs text-[#64748B] font-mono">
            Telemetry pulse meter: {building.meterId}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCreateInspection(building.id)}
              className="px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              Dispatch Inspection
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
