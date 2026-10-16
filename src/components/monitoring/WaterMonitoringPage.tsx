import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MeterReading } from '../../types';
import {
  Building2,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const WaterMonitoringPage: React.FC = () => {
  const { buildings, readings, settings, currentUser, themeMode } = useApp();

  const isResident = currentUser.role === 'resident';
  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    isResident ? residentBuildingId : 'ALL'
  );
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [granularity, setGranularity] = useState<'hourly' | 'daily'>('hourly');
  const [unit, setUnit] = useState<'litres' | 'm3'>('litres');
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const PAGE_SIZE = 15;

  const unitFactor = unit === 'm3' ? 0.001 : 1;
  const unitLabel = unit === 'm3' ? 'm³' : 'L';

  const effectiveBuildingId = isResident ? residentBuildingId : selectedBuildingId;

  // Filter Readings
  const filteredReadings = useMemo(() => {
    const now = new Date('2026-10-12T22:00:00+08:00').getTime();
    let hoursCutoff = 24 * 7;
    if (timeRange === '24h') hoursCutoff = 24;
    else if (timeRange === '30d') hoursCutoff = 24 * 30;

    const cutoffMillis = now - hoursCutoff * 3600 * 1000;

    return readings.filter((r) => {
      const matchBuilding =
        effectiveBuildingId === 'ALL' || r.buildingId === effectiveBuildingId;
      const matchTime = new Date(r.timestamp).getTime() >= cutoffMillis;
      return matchBuilding && matchTime;
    });
  }, [readings, effectiveBuildingId, timeRange]);

  // Aggregate Chart Data
  const chartData = useMemo(() => {
    if (granularity === 'hourly') {
      const timeMap = new Map<string, {
        time: string;
        timestamp: string;
        actual: number;
        expected: number;
        excess: number;
        isAnomalous: boolean;
        anomalyFlow: number | null;
        anomalyExcess: number | null;
      }>();

      filteredReadings.forEach((r) => {
        const key = r.timestamp.slice(0, 13) + ':00';
        const displayTime = `${r.timestamp.slice(5, 10)} ${r.timestamp.slice(11, 13)}:00`;
        const existing = timeMap.get(key) || {
          time: displayTime,
          timestamp: r.timestamp,
          actual: 0,
          expected: 0,
          excess: 0,
          isAnomalous: false,
          anomalyFlow: null,
          anomalyExcess: null,
        };

        existing.actual += r.consumptionLitres * unitFactor;
        existing.expected += r.expectedLitres * unitFactor;
        existing.excess += Math.max(0, r.consumptionLitres - r.expectedLitres) * unitFactor;

        if (r.isAnomalous) {
          existing.isAnomalous = true;
          existing.anomalyFlow = existing.actual;
          existing.anomalyExcess = existing.excess;
        }

        timeMap.set(key, existing);
      });

      return Array.from(timeMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } else {
      const dayMap = new Map<string, {
        time: string;
        timestamp: string;
        actual: number;
        expected: number;
        excess: number;
        isAnomalous: boolean;
        anomalyFlow: number | null;
      }>();

      filteredReadings.forEach((r) => {
        const dateKey = r.timestamp.slice(0, 10);
        const existing = dayMap.get(dateKey) || {
          time: dateKey.slice(5),
          timestamp: r.timestamp,
          actual: 0,
          expected: 0,
          excess: 0,
          isAnomalous: false,
          anomalyFlow: null,
        };

        existing.actual += r.consumptionLitres * unitFactor;
        existing.expected += r.expectedLitres * unitFactor;
        existing.excess += Math.max(0, r.consumptionLitres - r.expectedLitres) * unitFactor;

        if (r.isAnomalous) {
          existing.isAnomalous = true;
        }

        dayMap.set(dateKey, existing);
      });

      const list = Array.from(dayMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      list.forEach((item) => {
        if (item.isAnomalous || item.actual > item.expected * 1.15) {
          item.anomalyFlow = item.actual;
        }
      });

      return list;
    }
  }, [filteredReadings, granularity, unitFactor]);

  // Aggregated Summary Metrics
  const totalConsumed = useMemo(() => {
    return filteredReadings.reduce((sum, r) => sum + r.consumptionLitres, 0) * unitFactor;
  }, [filteredReadings, unitFactor]);

  const totalExpected = useMemo(() => {
    return filteredReadings.reduce((sum, r) => sum + r.expectedLitres, 0) * unitFactor;
  }, [filteredReadings, unitFactor]);

  const totalExcess = useMemo(() => {
    return (
      filteredReadings.reduce(
        (sum, r) => sum + Math.max(0, r.consumptionLitres - r.expectedLitres),
        0
      ) * unitFactor
    );
  }, [filteredReadings, unitFactor]);

  const anomalousPointsCount = useMemo(() => {
    return filteredReadings.filter((r) => r.isAnomalous).length;
  }, [filteredReadings]);

  const peakReading = useMemo(() => {
    if (filteredReadings.length === 0) return null;
    return [...filteredReadings].sort((a, b) => b.consumptionLitres - a.consumptionLitres)[0];
  }, [filteredReadings]);

  // Table Data with Filter
  const tableRows = useMemo(() => {
    let list = filteredReadings;
    if (showOnlyAnomalies) {
      list = list.filter((r) => r.isAnomalous);
    }
    return [...list].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredReadings, showOnlyAnomalies]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE) || 1;
  const paginatedRows = tableRows.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['reading_id', 'building_id', 'meter_id', 'timestamp', 'consumption_litres', 'expected_litres', 'excess_litres', 'is_anomalous', 'anomaly_rule'];
    const rows = filteredReadings.map((r) => [
      r.id,
      r.buildingId,
      r.meterId,
      r.timestamp,
      r.consumptionLitres,
      r.expectedLitres,
      Math.max(0, r.consumptionLitres - r.expectedLitres),
      r.isAnomalous ? 'YES' : 'NO',
      r.anomalyRule || 'NONE',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aqua_sentinel_readings_${effectiveBuildingId}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildingLookup = useMemo(() => {
    const m: Record<string, string> = {};
    buildings.forEach((b) => (m[b.id] = b.name));
    return m;
  }, [buildings]);

  const residentBuilding = buildings.find((b) => b.id === residentBuildingId);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility Selector */}
          {isResident ? (
            <div className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded text-xs font-medium text-[#0F2744]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Residence: {residentBuilding?.name || 'Hostel Block C'}</span>
              <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                {residentBuildingId}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-2.5 py-1 rounded text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#0F2744]" />
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                  setTablePage(1);
                }}
                className="bg-transparent text-[#0F172A] outline-none cursor-pointer max-w-[220px] truncate"
              >
                <option value="ALL">All Facilities (Aggregated Campus)</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Range */}
          <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded border border-[#E2E8F0] text-xs">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                timeRange === '24h' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                timeRange === '7d' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                timeRange === '30d' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              30d
            </button>
          </div>

          {/* Granularity */}
          <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded border border-[#E2E8F0] text-xs">
            <button
              onClick={() => setGranularity('hourly')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                granularity === 'hourly' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                granularity === 'daily' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Daily
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded border border-[#E2E8F0] text-xs">
            <button
              onClick={() => setUnit('litres')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                unit === 'litres' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Litres (L)
            </button>
            <button
              onClick={() => setUnit('m3')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                unit === 'm3' ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              m³
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded text-xs font-medium border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-[#E2E8F0]">
          <span className="text-xs text-[#64748B] font-medium block">Total Water Consumed</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#0F172A]">
              {Math.round(totalConsumed).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B] font-mono">{unitLabel}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-[#E2E8F0]">
          <span className="text-xs text-[#64748B] font-medium block">Expected Baseline Demand</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#64748B]">
              {Math.round(totalExpected).toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B] font-mono">{unitLabel}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-[#E2E8F0]">
          <span className="text-xs text-[#64748B] font-medium block">Potential Excess Flow</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-mono tabular-nums font-semibold ${
                totalExcess > 0 ? 'text-[#B9822B]' : 'text-[#2D6A4F]'
              }`}
            >
              {totalExcess > 0 ? `+${Math.round(totalExcess).toLocaleString()}` : '0'}
            </span>
            <span className="text-xs text-[#64748B] font-mono">{unitLabel}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[11px] text-[#B9822B] font-mono">
            ≈ RM {(((unit === 'm3' ? totalExcess : totalExcess / 1000) * settings.waterTariffRMPerM3)).toFixed(2)} cost loss
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-[#E2E8F0]">
          <span className="text-xs text-[#64748B] font-medium block">Flagged Anomaly Points</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-mono tabular-nums font-semibold text-[#B54747]">
              {anomalousPointsCount}
            </span>
            <span className="text-xs text-[#64748B]">hours</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#B54747]">
              {anomalousPointsCount > 0 ? 'Threshold Violation' : 'Nominal'}
            </span>
            <span className="text-[#64748B]">
              Peak: {peakReading ? Math.round(peakReading.consumptionLitres * unitFactor).toLocaleString() : 0} {unitLabel}/h
            </span>
          </div>
        </div>
      </div>

      {/* Main Time-Series Chart */}
      <div className="bg-white p-5 rounded-md border border-[#E2E8F0]">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Continuous Flow & Baseline Telemetry
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Meter telemetry plotted against diurnal baseline. Anomalies highlighted in red.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#0F172A] font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
              Actual Metered Flow
            </span>
            <span className="flex items-center gap-1.5 text-[#64748B]">
              <span className="w-2.5 h-0.5 bg-[#94A3B8]" />
              Expected Baseline
            </span>
            <span className={`flex items-center gap-1.5 font-medium px-1.5 py-0.2 rounded border ${
              themeMode === 'handcrafted' ? 'text-[#B2463F] bg-[#FBF2F1] border-[#F2D2CF]' : 'text-[#B54747] bg-[#FBECEC] border-[#EDBEBE]'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-xs ${themeMode === 'handcrafted' ? 'handcrafted-hatch border border-[#B2463F]' : 'bg-[#B54747]'}`} />
              Anomaly Point
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <pattern id="handcraftedHatchMon" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <rect width="6" height="6" fill="#FBF2F1" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#B2463F" strokeWidth="2.5" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray={themeMode === 'handcrafted' ? "3 3" : "2 2"} stroke={themeMode === 'handcrafted' ? "#EFECE4" : "#F1F5F9"} />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `${Math.round(v)}`} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${Math.round(Number(val) || 0).toLocaleString()} ${unitLabel}`,
                  name || 'Flow',
                ]}
                contentStyle={{
                  backgroundColor: themeMode === 'handcrafted' ? '#1A2838' : '#0F2744',
                  border: themeMode === 'handcrafted' ? '1px solid #2C3E52' : '1px solid #1E3A5F',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type={themeMode === 'handcrafted' ? 'linear' : 'monotone'}
                dataKey="expected"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill={themeMode === 'handcrafted' ? "#F4F2EC" : "#F8FAFC"}
                fillOpacity={0.4}
                name="Expected Baseline"
              />
              <Area
                type={themeMode === 'handcrafted' ? 'linear' : 'monotone'}
                dataKey="actual"
                stroke={themeMode === 'handcrafted' ? "#2C5B83" : "#2563EB"}
                strokeWidth={2}
                fill={themeMode === 'handcrafted' ? "#F0F4F8" : "#EFF6FF"}
                fillOpacity={0.6}
                name="Actual Flow"
              />
              <Bar
                dataKey="anomalyFlow"
                fill={themeMode === 'handcrafted' ? "url(#handcraftedHatchMon)" : "#B54747"}
                stroke={themeMode === 'handcrafted' ? "#B2463F" : "none"}
                strokeWidth={themeMode === 'handcrafted' ? 1 : 0}
                name="Anomaly Event"
                maxBarSize={14}
                radius={[3, 3, 0, 0]}
              />
              <Scatter dataKey="anomalyFlow" fill={themeMode === 'handcrafted' ? "#B2463F" : "#B54747"} shape="circle" name="Flagged Reading" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Readings Data Table */}
      <div className="bg-white rounded-md border border-[#E2E8F0] overflow-hidden">
        <div className="p-3.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Log Entries</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Individual meter readings from telemetry cache ({tableRows.length} total)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyAnomalies}
                onChange={(e) => {
                  setShowOnlyAnomalies(e.target.checked);
                  setTablePage(1);
                }}
                className="w-3.5 h-3.5 text-[#0F2744] rounded"
              />
              <span>Filter Only Anomalies</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Facility Name & ID</th>
                <th>Meter ID</th>
                <th>Actual Flow</th>
                <th>Expected Baseline</th>
                <th>Potential Excess</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#64748B] text-xs">
                    No readings found matching filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => {
                  const excess = Math.max(0, r.consumptionLitres - r.expectedLitres);

                  return (
                    <tr
                      key={r.id}
                      className={r.isAnomalous ? 'bg-[#F8FAFC]' : ''}
                    >
                      <td className="font-mono tabular-nums text-xs text-[#64748B]">
                        {r.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td>
                        <span className="font-medium text-[#0F172A]">
                          {buildingLookup[r.buildingId] || r.buildingId}
                        </span>
                        <span className="text-[10px] text-[#64748B] ml-1 font-mono">
                          ({r.buildingId})
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#64748B]">{r.meterId}</td>
                      <td className="font-mono tabular-nums text-xs font-medium text-[#0F172A]">
                        {Math.round(r.consumptionLitres * unitFactor).toLocaleString()} {unitLabel}
                      </td>
                      <td className="font-mono tabular-nums text-xs text-[#64748B]">
                        {Math.round(r.expectedLitres * unitFactor).toLocaleString()} {unitLabel}
                      </td>
                      <td className="font-mono tabular-nums text-xs">
                        {excess > 0 ? (
                          <span className="font-medium text-[#B9822B]">
                            +{Math.round(excess * unitFactor).toLocaleString()} {unitLabel}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">0</span>
                        )}
                      </td>
                      <td>
                        {r.isAnomalous ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE] flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{r.anomalyRule || 'Anomaly'}</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-mono tabular-nums text-[11px]">
            Showing {(tablePage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(tablePage * PAGE_SIZE, tableRows.length)} of {tableRows.length} readings
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={tablePage === 1}
              className="p-1 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-[#0F172A] px-2">
              {tablePage} / {totalPages}
            </span>
            <button
              onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
              disabled={tablePage === totalPages}
              className="p-1 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
