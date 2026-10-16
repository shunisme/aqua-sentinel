import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, BuildingCategory, AnomalyStatus } from '../../types';
import { BuildingDetailModal } from './BuildingDetailModal';
import { RegisterBuildingModal } from './RegisterBuildingModal';
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  MapPin,
  Layers,
  Gauge,
} from 'lucide-react';

interface BuildingsPageProps {
  onOpenCreateInspection: (buildingId: string) => void;
}

export const BuildingsPage: React.FC<BuildingsPageProps> = ({ onOpenCreateInspection }) => {
  const {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    settings,
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAnomalyStatus, setSelectedAnomalyStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'consumption' | 'excess' | 'name'>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);

  // Sync if selectedBuildingId is set from outside
  React.useEffect(() => {
    if (selectedBuildingId) {
      const b = buildings.find((x) => x.id === selectedBuildingId);
      if (b) setDetailBuilding(b);
    }
  }, [selectedBuildingId, buildings]);

  // Filter & Sort Buildings
  const filteredBuildings = useMemo(() => {
    return buildings
      .filter((b) => {
        const matchesSearch =
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.id.toLowerCase().includes(search.toLowerCase()) ||
          b.zone.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          selectedCategory === 'ALL' || b.category === selectedCategory;

        const matchesStatus =
          selectedAnomalyStatus === 'ALL' || b.anomalyStatus === selectedAnomalyStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'priority') {
          cmp = a.priorityScore - b.priorityScore;
        } else if (sortBy === 'consumption') {
          cmp = a.currentDailyLitres - b.currentDailyLitres;
        } else if (sortBy === 'excess') {
          const excessA = Math.max(0, a.currentDailyLitres - a.expectedDailyLitres);
          const excessB = Math.max(0, b.currentDailyLitres - b.expectedDailyLitres);
          cmp = excessA - excessB;
        } else if (sortBy === 'name') {
          cmp = a.name.localeCompare(b.name);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [buildings, search, selectedCategory, selectedAnomalyStatus, sortBy, sortAsc]);

  const categories: Array<BuildingCategory | 'ALL'> = [
    'ALL',
    'Residential',
    'Laboratory',
    'Lecture Hall',
    'Sports Complex',
    'Administrative',
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
            Campus Facilities Directory
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Registry of metered university facilities, baseline thresholds, and inspection statuses.
          </p>
        </div>

        <button
          onClick={() => {
            setBuildingToEdit(null);
            setIsRegisterOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Register Facility</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facilities by name, ID, zone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] focus:bg-white text-[#0F172A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
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
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded-md text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-[#0F172A] outline-none cursor-pointer"
              >
                <option value="priority">Priority Urgency</option>
                <option value="consumption">Daily Usage</option>
                <option value="excess">Excess Waste Flow</option>
                <option value="name">Building Name</option>
              </select>
            </div>

            {/* Status filter */}
            <select
              value={selectedAnomalyStatus}
              onChange={(e) => setSelectedAnomalyStatus(e.target.value)}
              className="bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded-md text-xs font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#2563EB]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Suspected Leak">Suspected Leak</option>
              <option value="High Flow">High Flow</option>
              <option value="Under Inspection">Under Inspection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Facility ID & Name</th>
                  <th className="py-2.5 px-3.5">Category / Zone</th>
                  <th className="py-2.5 px-3.5">Daily Usage</th>
                  <th className="py-2.5 px-3.5">Baseline Expected</th>
                  <th className="py-2.5 px-3.5">Est. Excess</th>
                  <th className="py-2.5 px-3.5">Anomaly Status</th>
                  <th className="py-2.5 px-3.5">Urgency Score</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                      No facilities match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBuildings.map((b) => {
                    const excess = Math.max(0, b.currentDailyLitres - b.expectedDailyLitres);

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-[#F8FAFC]/60 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedBuildingId(b.id);
                          setDetailBuilding(b);
                        }}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-[#F8FAFC] text-[#64748B] group-hover:text-[#0F2744] flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-[#0F172A] group-hover:text-[#0F2744] transition-colors">
                                {b.name}
                              </p>
                              <p className="text-[10px] text-[#64748B] font-mono">
                                {b.id} • {b.meterId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <p className="font-medium text-xs text-[#0F172A]">{b.category === 'Hostel' ? 'Residential' : b.category}</p>
                          <p className="text-[10px] text-[#64748B]">{b.zone}</p>
                        </td>

                        <td className="py-3 px-3.5 font-mono font-semibold text-xs text-[#0F172A] tabular-nums">
                          {Math.round(b.currentDailyLitres).toLocaleString()} L
                        </td>

                        <td className="py-3 px-3.5 text-[#64748B] font-mono tabular-nums">
                          {Math.round(b.expectedDailyLitres).toLocaleString()} L
                        </td>

                        <td className="py-3 px-3.5">
                          {excess > 0 ? (
                            <span className="font-mono font-semibold text-[#B54747] tabular-nums">
                              +{Math.round(excess).toLocaleString()} L
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#64748B]">Within baseline</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                              b.anomalyStatus === 'Suspected Leak'
                                ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                                : b.anomalyStatus === 'High Flow'
                                ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                                : b.anomalyStatus === 'Under Inspection'
                                ? 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
                                : 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                            }`}
                          >
                            {b.anomalyStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-semibold tabular-nums ${
                                b.priorityScore >= 80
                                  ? 'text-[#B54747]'
                                  : b.priorityScore >= 60
                                  ? 'text-[#B9822B]'
                                  : 'text-[#2D6A4F]'
                              }`}
                            >
                              {b.priorityScore}
                            </span>
                            <div className="w-12 bg-[#E2E8F0] rounded h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  b.priorityScore >= 80
                                    ? 'bg-[#B54747]'
                                    : b.priorityScore >= 60
                                    ? 'bg-[#B9822B]'
                                    : 'bg-[#2D6A4F]'
                                }`}
                                style={{ width: `${b.priorityScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setDetailBuilding(b);
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded-md border border-[#E2E8F0] cursor-pointer"
                          >
                            Telemetry
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBuildings.map((b) => {
            const excess = Math.max(0, b.currentDailyLitres - b.expectedDailyLitres);

            return (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBuildingId(b.id);
                  setDetailBuilding(b);
                }}
                className="bg-white p-4 rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] transition-all cursor-pointer flex flex-col justify-between group space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-[#F8FAFC] group-hover:bg-[#EFF6FF] text-[#64748B] group-hover:text-[#0F2744] flex items-center justify-center transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-[#0F172A] group-hover:text-[#0F2744] transition-colors">
                          {b.name}
                        </h3>
                        <p className="text-[10px] text-[#64748B] font-mono">
                          {b.id} • {b.zone}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                        b.anomalyStatus === 'Suspected Leak'
                          ? 'bg-[#FBECEC] text-[#B54747] border border-[#EDBEBE]'
                          : b.anomalyStatus === 'High Flow'
                          ? 'bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]'
                          : 'bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE]'
                      }`}
                    >
                      {b.anomalyStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F8FAFC] rounded-md text-xs mb-2">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Current Flow</span>
                      <p className="font-mono font-semibold text-[#0F172A] tabular-nums">
                        {Math.round(b.currentDailyLitres).toLocaleString()} L
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Baseline</span>
                      <p className="font-mono font-medium text-[#64748B] tabular-nums">
                        {Math.round(b.expectedDailyLitres).toLocaleString()} L
                      </p>
                    </div>
                  </div>

                  {excess > 0 ? (
                    <div className="text-xs text-[#B54747] font-mono font-semibold flex items-center justify-between">
                      <span>Potential Excess:</span>
                      <span className="tabular-nums">+{Math.round(excess).toLocaleString()} L/day</span>
                    </div>
                  ) : (
                    <div className="text-xs text-[#2D6A4F] font-medium flex items-center justify-between">
                      <span>Consumption:</span>
                      <span>Optimal Baseline</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B] text-[11px]">Score:</span>
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        b.priorityScore >= 80
                          ? 'text-[#B54747]'
                          : b.priorityScore >= 60
                          ? 'text-[#B9822B]'
                          : 'text-[#2D6A4F]'
                      }`}
                    >
                      {b.priorityScore}/100
                    </span>
                  </div>

                  <span className="text-[#0F2744] font-medium flex items-center gap-0.5 text-xs">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Building Detail Modal */}
      <BuildingDetailModal
        building={detailBuilding}
        onClose={() => {
          setDetailBuilding(null);
          setSelectedBuildingId(null);
        }}
        onOpenCreateInspection={(buildingId) => {
          setDetailBuilding(null);
          onOpenCreateInspection(buildingId);
        }}
        onEditBuilding={(b) => {
          setBuildingToEdit(b);
          setIsRegisterOpen(true);
        }}
      />

      {/* Register / Edit Building Modal */}
      <RegisterBuildingModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setBuildingToEdit(null);
        }}
        buildingToEdit={buildingToEdit}
      />
    </div>
  );
};
