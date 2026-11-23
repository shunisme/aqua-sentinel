import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Droplets,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Plus,
  Flame,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OverviewPageProps {
  onOpenCreateInspection: (buildingId?: string, alertId?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onOpenCreateInspection }) => {
  const {
    buildings,
    readings,
    alerts,
    inspections,
    settings,
    dateFilter,
    setDateFilter,
    setCurrentPage,
    setSelectedBuildingId,
    setSelectedAlertId,
    themeMode,
  } = useApp();

  // Facility table tab state: 'urgent' | 'all'
  const [facilityTab, setFacilityTab] = useState<'urgent' | 'all'>('urgent');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter readings based on active date range
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const now = new Date('2026-10-12T22:00:00+08:00').getTime();
    let hoursCutoff = 24 * 7; // default 7 days
    if (dateFilter === 'today') hoursCutoff = 24;
    else if (dateFilter === '30d') hoursCutoff = 24 * 30;
    else if (dateFilter === 'all') hoursCutoff = 24 * 60;

    const cutoffMillis = now - hoursCutoff * 3600 * 1000;
    return readings.filter((r) => new Date(r.timestamp).getTime() >= cutoffMillis);
  }, [readings, dateFilter]);

  // Aggregate Total Consumption Today
  const todayReadings = useMemo(() => {
    const todayCutoff = new Date('2026-10-12T00:00:00+08:00').getTime();
    return readings.filter((r) => new Date(r.timestamp).getTime() >= todayCutoff);
  }, [readings]);

  const totalConsumptionTodayLitres = useMemo(() => {
    return todayReadings.reduce((sum, r) => sum + r.consumptionLitres, 0);
  }, [todayReadings]);

  const expectedConsumptionTodayLitres = useMemo(() => {
    return todayReadings.reduce((sum, r) => sum + r.expectedLitres, 0);
  }, [todayReadings]);

  const todayDiffLitres = totalConsumptionTodayLitres - expectedConsumptionTodayLitres;
  const consumptionDiffPercent = useMemo(() => {
    if (expectedConsumptionTodayLitres === 0) return 0;
    return Math.round(
      ((totalConsumptionTodayLitres - expectedConsumptionTodayLitres) /
        expectedConsumptionTodayLitres) *
        100
    );
  }, [totalConsumptionTodayLitres, expectedConsumptionTodayLitres]);

  // Active Alerts
  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => a.status !== 'Resolved' && a.status !== 'False Positive');
  }, [alerts]);

  const criticalAlertsCount = activeAlerts.filter((a) => a.severity === 'Critical').length;
  const highAlertsCount = activeAlerts.filter((a) => a.severity === 'High').length;

  // Estimated Potential Excess Consumption (L/day)
  const potentialExcessDailyLitres = useMemo(() => {
    return activeAlerts.reduce((sum, a) => sum + a.estimatedExcessLitres, 0);
  }, [activeAlerts]);

  const potentialExcessDailyCostRM = useMemo(() => {
    return (potentialExcessDailyLitres / 1000) * settings.waterTariffRMPerM3;
  }, [potentialExcessDailyLitres, settings.waterTariffRMPerM3]);

  // Buildings requiring inspection
  const buildingsNeedingAttention = useMemo(() => {
    return buildings
      .filter((b) => b.priorityScore >= 35 || b.openAlertsCount > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [buildings]);

  // All facilities sorted by current flow
  const allFacilitiesSorted = useMemo(() => {
    return [...buildings].sort((a, b) => b.currentDailyLitres - a.currentDailyLitres);
  }, [buildings]);

  // Completed & Verified Repairs Impact
  const verifiedRepairs = useMemo(() => {
    return inspections.filter((i) => i.status === 'Verified');
  }, [inspections]);

  const verifiedSavedLitresPerDay = useMemo(() => {
    return verifiedRepairs.reduce(
      (sum, i) => sum + (i.verification?.dailySavedLitres || 0),
      0
    );
  }, [verifiedRepairs]);

  const dailySavedRM = useMemo(() => {
    return (verifiedSavedLitresPerDay / 1000) * settings.waterTariffRMPerM3;
  }, [verifiedSavedLitresPerDay, settings.waterTariffRMPerM3]);

  // Time-Series Trend Chart Data
  const trendChartData = useMemo(() => {
    if (!filteredReadings || filteredReadings.length === 0) return [];

    const isHourly = dateFilter === 'today';
    const groupMap = new Map<
      string,
      {
        date: string;
        actual: number;
        expected: number;
        excess: number;
        hasAnomaly: boolean;
        anomalyCount: number;
        anomalyFlow: number | null;
      }
    >();

    filteredReadings.forEach((r) => {
      const dateKey = isHourly ? `${r.timestamp.slice(11, 13)}:00` : r.timestamp.slice(5, 10);
      const existing = groupMap.get(dateKey) || {
        date: dateKey,
        actual: 0,
        expected: 0,
        excess: 0,
        hasAnomaly: false,
        anomalyCount: 0,
        anomalyFlow: null,
      };

      existing.actual += r.consumptionLitres;
      existing.expected += r.expectedLitres;
      existing.excess += Math.max(0, r.consumptionLitres - r.expectedLitres);

      if (r.isAnomalous) {
        existing.hasAnomaly = true;
        existing.anomalyCount += 1;
      }

      groupMap.set(dateKey, existing);
    });

    const list = Array.from(groupMap.values());
    list.sort((a, b) => a.date.localeCompare(b.date));

    list.forEach((item) => {
      if (item.hasAnomaly || (item.excess > 500 && item.actual > item.expected * 1.12)) {
        item.hasAnomaly = true;
        item.anomalyFlow = item.actual;
      }
    });

    return list;
  }, [filteredReadings, dateFilter]);

  // Chart Metric Summaries for the selected window
  const chartMetrics = useMemo(() => {
    const totalActual = trendChartData.reduce((s, r) => s + r.actual, 0);
    const totalExpected = trendChartData.reduce((s, r) => s + r.expected, 0);
    const variancePct =
      totalExpected > 0 ? Math.round(((totalActual - totalExpected) / totalExpected) * 100) : 0;
    const anomalyPointsCount = trendChartData.filter((r) => r.hasAnomaly).length;
    return { totalActual, totalExpected, variancePct, anomalyPointsCount };
  }, [trendChartData]);

  // Clean anomaly point renderer
  const renderAnomalyDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || !payload.hasAnomaly) return null;
    return (
      <g key={`anomaly-dot-${payload.date}`}>
        <circle cx={cx} cy={cy} r={6} fill="#DC2626" fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={3.5} fill="#DC2626" stroke="#FFFFFF" strokeWidth={1.5} />
      </g>
    );
  };

  // Filtered facilities for table
  const displayedFacilities = useMemo(() => {
    let list = facilityTab === 'urgent' ? buildingsNeedingAttention : allFacilitiesSorted;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.zone.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.anomalyStatus === statusFilter);
    }

    return list;
  }, [facilityTab, buildingsNeedingAttention, allFacilitiesSorted, tableSearch, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Time Filter & Live Sync Toolbar (Clean & unified) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-lg border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-[#0F172A]">Time Range:</span>
          <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-md text-xs font-medium border border-[#E2E8F0]">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('7d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === '7d'
                  ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateFilter('30d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === '30d'
                  ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#059669] font-medium bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Live Telemetry Active</span>
          </span>
        </div>
      </div>

      {/* 2. Operational Health Status Banner (Clear & action-oriented) */}
      {criticalAlertsCount > 0 || highAlertsCount > 0 ? (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FEE2E2] rounded-md text-[#DC2626] flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#991B1B]">
                  Action Needed: {buildingsNeedingAttention.length} facilities flagged with active leaks
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#DC2626] text-white">
                  {criticalAlertsCount} Critical
                </span>
                {highAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#D97706] text-white">
                    {highAlertsCount} High Priority
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7F1D1D] mt-0.5">
                Estimated water waste: ~{Math.round(potentialExcessDailyLitres).toLocaleString()} L/day (approx. RM {potentialExcessDailyCostRM.toFixed(2)}/day).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('alerts')}
              className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Review Leak Alerts →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span className="text-xs font-medium text-[#065F46]">
              All monitored facilities are operating within normal baseline consumption.
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#059669]">Telemetry Synchronized</span>
        </div>
      )}

      {/* 3. Four Executive KPI Cards (Simple language & 1-click action) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Consumption */}
        <div
          onClick={() => setCurrentPage('monitoring')}
          className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium mb-1.5">
            <span>Today's Water Flow</span>
            <Droplets className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#0F172A]">
              {Math.round(totalConsumptionTodayLitres).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">Litres</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
            <span className={todayDiffLitres > 0 ? 'text-[#D97706] font-medium' : 'text-[#64748B]'}>
              {todayDiffLitres > 0 ? `+${Math.round(todayDiffLitres).toLocaleString()} L (+${consumptionDiffPercent}%)` : 'Normal baseline'}
            </span>
            <span className="text-[#2563EB] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View chart</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Active Alerts */}
        <div
          onClick={() => setCurrentPage('alerts')}
          className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-[#DC2626] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium mb-1.5">
            <span>Active Leak Alerts</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#DC2626]">
              {activeAlerts.length}
            </span>
            <span className="text-xs text-[#64748B]">unresolved</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
            <span className="text-[#DC2626] font-medium">
              {criticalAlertsCount} Critical • {highAlertsCount} High
            </span>
            <span className="text-[#DC2626] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Inspect</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Potential Excess Flow */}
        <div
          onClick={() => {
            setFacilityTab('urgent');
            const el = document.getElementById('prioritisation-table');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-[#D97706] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium mb-1.5">
            <span>Estimated Water Waste</span>
            <Flame className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#D97706]">
              +{Math.round(potentialExcessDailyLitres).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">L / day</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
            <span className="text-[#64748B] font-mono">
              ≈ RM {potentialExcessDailyCostRM.toFixed(2)}/day
            </span>
            <span className="text-[#D97706] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Priorities</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Verified Post-Repair Savings */}
        <div
          onClick={() => setCurrentPage('maintenance')}
          className="bg-white p-5 rounded-lg border border-[#E2E8F0] hover:border-[#059669] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium mb-1.5">
            <span>Verified Water Saved</span>
            <TrendingDown className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#059669]">
              +{Math.round(verifiedSavedLitresPerDay).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">L / day</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
            <span className="text-[#059669] font-mono font-medium">
              {verifiedRepairs.length} verified (RM {dailySavedRM.toFixed(2)}/day)
            </span>
            <span className="text-[#059669] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>History</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 4. Consumption & Baseline Chart */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Water Consumption & Baseline Trend
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Hourly campus water consumption compared against expected normal usage
            </p>
          </div>

          {/* Time Filter on Chart */}
          <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-md text-xs font-medium border border-[#E2E8F0]">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('7d')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === '7d'
                  ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateFilter('30d')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                dateFilter === '30d'
                  ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Quick Summary Strip above graph */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono py-2 px-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] mb-4 text-[#64748B]">
          <div>
            <span>Water Used: </span>
            <span className="font-semibold text-[#0F172A]">{Math.round(chartMetrics.totalActual).toLocaleString()} L</span>
          </div>
          <div>
            <span>Normal Baseline: </span>
            <span className="font-semibold text-[#0F172A]">{Math.round(chartMetrics.totalExpected).toLocaleString()} L</span>
          </div>
          <div>
            <span>Difference: </span>
            <span className={`font-semibold ${chartMetrics.variancePct > 5 ? 'text-[#D97706]' : 'text-[#059669]'}`}>
              {chartMetrics.variancePct > 0 ? `+${chartMetrics.variancePct}%` : `${chartMetrics.variancePct}%`}
            </span>
          </div>
          {chartMetrics.anomalyPointsCount > 0 && (
            <div className="text-[#DC2626] font-semibold flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>{chartMetrics.anomalyPointsCount} Anomaly Spikes Detected</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0]?.payload;
                  const actualVal = data?.actual || 0;
                  const expectedVal = data?.expected || 0;
                  const isAnom = data?.hasAnomaly;

                  return (
                    <div className="bg-[#0F172A] text-white p-3 rounded-md shadow-md text-xs space-y-1.5 border border-[#1E293B]">
                      <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-1 font-mono text-[11px]">
                        <span className="text-[#94A3B8]">{label}</span>
                        {isAnom ? (
                          <span className="px-1.5 py-0.2 rounded bg-[#DC2626] text-white text-[10px] font-medium">
                            Anomaly Flagged
                          </span>
                        ) : (
                          <span className="text-[#10B981] text-[10px]">Normal Flow</span>
                        )}
                      </div>
                      <div className="space-y-1 pt-0.5 text-[11px] font-mono tabular-nums">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#94A3B8]">Actual Flow:</span>
                          <span className="font-semibold">{Math.round(actualVal).toLocaleString()} L</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#94A3B8]">Baseline Expected:</span>
                          <span>{Math.round(expectedVal).toLocaleString()} L</span>
                        </div>
                        {isAnom && (data?.excess > 0 || actualVal > expectedVal) && (
                          <div className="flex items-center justify-between gap-4 text-[#FCA5A5] border-t border-[#1E293B] pt-1 font-semibold">
                            <span>Excess Flow:</span>
                            <span>+{Math.round(Math.max(0, actualVal - expectedVal)).toLocaleString()} L</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="#F8FAFC"
                fillOpacity={0.6}
                name="Expected Baseline"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#2563EB"
                strokeWidth={2}
                fill="#EFF6FF"
                fillOpacity={0.4}
                dot={renderAnomalyDot}
                name="Actual Consumption"
              />
              <Bar
                dataKey="anomalyFlow"
                fill="#DC2626"
                stroke="#B91C1C"
                strokeWidth={0.5}
                name="Anomaly Event"
                maxBarSize={12}
                radius={[2, 2, 0, 0]}
                opacity={0.85}
              />
              <Scatter dataKey="anomalyFlow" fill="#DC2626" shape="circle" name="Flagged Point" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-[#F1F5F9] text-xs">
          <span className="flex items-center gap-2 text-[#0F172A] font-medium">
            <span className="w-3 h-1 rounded-full bg-[#2563EB]" />
            Actual Flow
          </span>
          <span className="flex items-center gap-2 text-[#64748B]">
            <span className="w-3 h-0.5 bg-[#94A3B8] border-b border-dashed" />
            Baseline Expected
          </span>
          <span className="flex items-center gap-2 text-[#DC2626] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            Flagged Anomaly Event
          </span>
        </div>
      </div>

      {/* 5. Priority Leak & Inspection List */}
      <div id="prioritisation-table" className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Priority Leak & Inspection Queue
            </h2>
            {/* View Tabs */}
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-md text-xs font-medium border border-[#E2E8F0]">
              <button
                onClick={() => setFacilityTab('urgent')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  facilityTab === 'urgent'
                    ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>Needs Attention</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  facilityTab === 'urgent' ? 'bg-[#DC2626] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {buildingsNeedingAttention.length}
                </span>
              </button>
              <button
                onClick={() => setFacilityTab('all')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  facilityTab === 'all'
                    ? 'bg-white text-[#0F172A] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>All Buildings</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  facilityTab === 'all' ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {allFacilitiesSorted.length}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search facility name or zone..."
                className="pl-8 pr-3 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] w-48 sm:w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Suspected Leak">Suspected Leak</option>
              <option value="High Flow">High Flow</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Facility & Diagnostic Summary</th>
                <th>Urgency Score</th>
                <th>Status</th>
                <th>Excess Demand</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedFacilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                    No facilities found matching the active filter criteria.
                  </td>
                </tr>
              ) : (
                displayedFacilities.map((b) => {
                  const bActiveAlert = alerts.find(
                    (a) => a.buildingId === b.id && a.status !== 'Resolved' && a.status !== 'False Positive'
                  );
                  const excess24h = Math.max(0, b.currentDailyLitres - b.expectedDailyLitres);

                  // Primary reason explanation
                  const issueReason = bActiveAlert
                    ? bActiveAlert.explanation
                    : b.anomalyStatus === 'Under Inspection'
                    ? 'Technical inspection assigned • Active field verification'
                    : b.anomalyStatus === 'Normal'
                    ? 'Routine operation • Flow within expected diurnal baseline'
                    : 'Monitored usage profile';

                  return (
                    <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Facility details + reason */}
                      <td className="py-3">
                        <div className="max-w-md">
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setCurrentPage('buildings');
                            }}
                            className="font-semibold text-[#0F172A] hover:text-[#2563EB] text-left cursor-pointer transition-colors block text-sm"
                          >
                            {b.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B] font-mono">
                            <span>{b.id}</span>
                            <span>•</span>
                            <span className="font-sans">{b.zone}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1 italic">
                            {issueReason}
                          </p>
                        </div>
                      </td>

                      {/* Urgency Score */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono tabular-nums text-xs font-semibold ${
                              b.priorityScore >= 80
                                ? 'text-[#DC2626]'
                                : b.priorityScore >= 60
                                ? 'text-[#D97706]'
                                : 'text-[#059669]'
                            }`}
                          >
                            {b.priorityScore}
                          </span>
                          <div className="w-16 bg-[#F1F5F9] rounded h-1.5 overflow-hidden border border-[#E2E8F0]">
                            <div
                              className={`h-full ${
                                b.priorityScore >= 80
                                  ? 'bg-[#DC2626]'
                                  : b.priorityScore >= 60
                                  ? 'bg-[#D97706]'
                                  : 'bg-[#059669]'
                              }`}
                              style={{ width: `${b.priorityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                            b.anomalyStatus === 'Suspected Leak'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                              : b.anomalyStatus === 'High Flow'
                              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                              : b.anomalyStatus === 'Under Inspection'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {b.anomalyStatus}
                        </span>
                      </td>

                      {/* Excess Demand */}
                      <td className="font-mono tabular-nums text-xs">
                        {excess24h > 0 ? (
                          <span className="text-[#D97706] font-medium">
                            +{Math.round(excess24h).toLocaleString()} L/day
                          </span>
                        ) : bActiveAlert && bActiveAlert.estimatedExcessLitres > 0 ? (
                          <span className="text-[#D97706] font-medium">
                            +{Math.round(bActiveAlert.estimatedExcessLitres).toLocaleString()} L/day{' '}
                            <span className="text-[10px] text-[#64748B] font-sans font-normal">
                              ({bActiveAlert.rule === 'SPIKE' ? 'Spike' : 'Overnight'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">Within baseline</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="text-right">
                        {b.anomalyStatus === 'Under Inspection' ? (
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setCurrentPage('queue');
                            }}
                            className="px-3 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] text-xs font-medium rounded border border-[#BFDBFE] transition-colors cursor-pointer shadow-2xs"
                          >
                            View Ticket
                          </button>
                        ) : b.anomalyStatus === 'Normal' ? (
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setCurrentPage('buildings');
                            }}
                            className="px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] text-xs font-medium rounded border border-[#E2E8F0] transition-colors cursor-pointer shadow-2xs"
                          >
                            Audit
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              onOpenCreateInspection(b.id, bActiveAlert?.id);
                            }}
                            className="px-3 py-1 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium rounded border border-[#0F172A] transition-colors cursor-pointer shadow-2xs"
                          >
                            Dispatch
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>Displaying {displayedFacilities.length} facilities</span>
          <button
            onClick={() => setCurrentPage('buildings')}
            className="text-[#2563EB] hover:text-[#0F172A] font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>View all facilities in directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
