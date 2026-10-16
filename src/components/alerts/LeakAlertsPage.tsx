import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AnomalyAlert, AlertSeverity } from '../../types';
import { AlertDetailModal } from './AlertDetailModal';
import {
  Search,
  ArrowUpDown,
  Building2,
} from 'lucide-react';

interface LeakAlertsPageProps {
  onOpenCreateInspection: (buildingId: string, alertId?: string) => void;
}

export const LeakAlertsPage: React.FC<LeakAlertsPageProps> = ({ onOpenCreateInspection }) => {
  const {
    alerts,
    selectedAlertId,
    setSelectedAlertId,
    acknowledgeAlert,
    settings,
    currentUser,
    buildings,
  } = useApp();

  const isResident = currentUser.role === 'resident';
  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';
  const residentBuilding = buildings.find((b) => b.id === residentBuildingId);

  // Scoped alerts base: if resident, filter strictly to own house
  const baseAlerts = useMemo(() => {
    return isResident
      ? alerts.filter((a) => a.buildingId === residentBuildingId)
      : alerts;
  }, [alerts, isResident, residentBuildingId]);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'excess' | 'date' | 'severity'>('excess');
  const [sortAsc, setSortAsc] = useState(false);

  const [detailAlert, setDetailAlert] = useState<AnomalyAlert | null>(null);

  // Sync if selectedAlertId is set
  React.useEffect(() => {
    if (selectedAlertId) {
      const a = baseAlerts.find((x) => x.id === selectedAlertId);
      if (a) setDetailAlert(a);
    }
  }, [selectedAlertId, baseAlerts]);

  // Filter & Sort
  const filteredAlerts = useMemo(() => {
    return baseAlerts
      .filter((a) => {
        const matchesSearch =
          a.buildingName.toLowerCase().includes(search.toLowerCase()) ||
          a.id.toLowerCase().includes(search.toLowerCase()) ||
          a.ruleName.toLowerCase().includes(search.toLowerCase());

        const matchesSeverity =
          severityFilter === 'ALL' || a.severity === severityFilter;

        const matchesStatus =
          statusFilter === 'ALL' || a.status === statusFilter;

        const matchesRule =
          ruleFilter === 'ALL' || a.rule === ruleFilter;

        return matchesSearch && matchesSeverity && matchesStatus && matchesRule;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'excess') {
          cmp = a.estimatedExcessLitres - b.estimatedExcessLitres;
        } else if (sortBy === 'date') {
          cmp = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
        } else if (sortBy === 'severity') {
          const rank: Record<AlertSeverity, number> = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1,
          };
          cmp = rank[a.severity] - rank[b.severity];
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [baseAlerts, search, severityFilter, statusFilter, ruleFilter, sortBy, sortAsc]);

  const activeCount = baseAlerts.filter(
    (a) => a.status !== 'Resolved' && a.status !== 'False Positive'
  ).length;

  return (
    <div className="space-y-6">
      {/* Resident House Context Banner */}
      {isResident && (
        <div className="bg-white border border-[#E2E8F0] rounded-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#EFF6FF] text-[#0F2744] flex items-center justify-center border border-[#BFDBFE]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">
                My Residence: {residentBuilding?.name || 'Hostel Block C'}
              </p>
              <p className="text-[11px] text-[#64748B]">
                Isolated telemetry events for meter {residentBuilding?.meterId || 'MTR-102'}.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0F2744] border border-[#BFDBFE]">
            {activeCount} Active Alert{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by ID, facility, or rule..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded outline-none focus:border-[#2563EB] focus:bg-white text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded text-xs font-medium text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded text-xs font-medium text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Inspection Created">Inspection Created</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1.5 rounded border border-[#E2E8F0] text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-[#0F172A] outline-none cursor-pointer"
              >
                <option value="excess">Excess Volume</option>
                <option value="date">Detection Time</option>
                <option value="severity">Severity Level</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-md border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Alert ID & Facility</th>
                <th>Detection Rule</th>
                <th>Severity vs Evidence</th>
                <th>Flow Telemetry</th>
                <th>Potential Excess</th>
                <th>Duration</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#64748B] text-xs">
                    No leak alerts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAlertId(a.id);
                      setDetailAlert(a);
                    }}
                  >
                    <td>
                      <div>
                        <p className="font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors">
                          {a.buildingName}
                        </p>
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          {a.id} • {a.detectedAt.slice(0, 10)}
                        </p>
                      </div>
                    </td>

                    <td className="text-xs text-[#0F172A]">
                      {a.ruleName}
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            a.severity === 'Critical'
                              ? 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                              : a.severity === 'High'
                              ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                              : a.severity === 'Medium'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {a.severity}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          ({a.evidenceStrength})
                        </span>
                      </div>
                    </td>

                    <td className="font-mono tabular-nums text-xs">
                      <p className="font-medium text-[#0F172A]">
                        {Math.round(a.actualLitres).toLocaleString()} L/hr
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        Baseline: {Math.round(a.expectedLitres).toLocaleString()} L/hr
                      </p>
                    </td>

                    <td className="font-mono tabular-nums text-xs">
                      <p className="font-medium text-[#B9822B]">
                        +{Math.round(a.estimatedExcessLitres).toLocaleString()} L
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        ≈ RM {((a.estimatedExcessLitres / 1000) * settings.waterTariffRMPerM3).toFixed(2)}
                      </p>
                    </td>

                    <td className="font-mono tabular-nums text-xs text-[#0F172A]">
                      {a.durationHours} hr{a.durationHours > 1 ? 's' : ''}
                    </td>

                    <td>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                          a.status === 'Resolved'
                            ? 'bg-[#EFF6FF] text-[#2D6A4F] border-[#BFDBFE]'
                            : a.status === 'False Positive'
                            ? 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                            : a.status === 'Acknowledged'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                            : a.status === 'Under Investigation' || a.status === 'Inspection Created'
                            ? 'bg-[#FAF3E7] text-[#B9822B] border-[#ECD9B7]'
                            : 'bg-[#FBECEC] text-[#B54747] border-[#EDBEBE]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === 'New' && (
                          <button
                            onClick={() => acknowledgeAlert(a.id)}
                            className="px-2.5 py-1 text-white bg-[#0F2744] hover:bg-[#1E3A5F] font-medium rounded text-xs transition-colors cursor-pointer"
                          >
                            Ack
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAlertId(a.id);
                            setDetailAlert(a);
                          }}
                          className="px-2.5 py-1 text-[#0F172A] bg-white hover:bg-[#F8FAFC] font-medium rounded text-xs transition-colors border border-[#E2E8F0] cursor-pointer"
                        >
                          Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={detailAlert}
        onClose={() => {
          setDetailAlert(null);
          setSelectedAlertId(null);
        }}
        onOpenCreateInspection={onOpenCreateInspection}
      />
    </div>
  );
};
