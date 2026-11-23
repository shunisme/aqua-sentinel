import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  CheckCircle2,
  Plus,
  ChevronDown,
  Building2,
  Wrench,
  User,
  Settings,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  onOpenCreateInspection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateInspection }) => {
  const {
    currentPage,
    setCurrentPage,
    alerts,
    buildings,
    setSelectedBuildingId,
    setSelectedAlertId,
    toastMessage,
    currentUser,
    switchRole,
    logout,
    themeMode,
  } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Overview Dashboard',
      subtitle: 'Real-time telemetry, campus water consumption, and leak detection',
    },
    buildings: {
      title: 'Campus Buildings',
      subtitle: 'Facility status, smart meter performance, and anomaly tracking',
    },
    monitoring: {
      title: 'Water Monitoring',
      subtitle: 'Time-series consumption curves, baselines, and excess water analysis',
    },
    alerts: {
      title: 'Leak Alerts & Anomalies',
      subtitle: 'Continuous nocturnal flow, volume spikes, and unusual pattern flags',
    },
    queue: {
      title: 'Inspection Queue',
      subtitle: 'Priority-ranked facilities ordered by multi-factor urgency score',
    },
    maintenance: {
      title: 'Maintenance & Workflows',
      subtitle: 'Field findings, pipe repair records, and work order audit trail',
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Detection thresholds, priority formula weights, and Supabase cloud setup',
    },
    resident_portal: {
      title: 'Resident Portal',
      subtitle: 'Living quarters water status, issue reporting, and repair tracking',
    },
    technician_view: {
      title: 'Repair Worker Workspace',
      subtitle: 'Assigned inspection tickets, physical findings logger, and verification',
    },
  };

  const currentInfo = pageTitles[currentPage] || {
    title: 'Aqua Sentinel',
    subtitle: 'Smart Water Leak Detection Platform',
  };

  // Search results
  const filteredBuildings = searchQuery.trim()
    ? buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.zone.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredAlerts = searchQuery.trim()
    ? alerts.filter(
        (a) =>
          a.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.ruleName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white px-6 py-3 select-none">
      {/* Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-6 z-50 bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 border border-[#1E293B] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Left: Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>Aqua Sentinel</span>
            <span>/</span>
            <span className="text-[#0F172A] font-medium capitalize">
              {currentPage.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">
            {currentInfo.title}
          </h1>
        </div>

        {/* Right: Actions, Search, Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Dispatch Action Button */}
          {currentUser.role !== 'resident' && (
            <button
              onClick={onOpenCreateInspection}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Create new inspection order"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Inspection</span>
            </button>
          )}

          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors border border-[#E2E8F0] cursor-pointer"
            title="Search campus facilities, meters and alerts"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Active Role Switcher */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              title="Switch active role"
            >
              {currentUser.role === 'admin' && <Building2 className="w-3.5 h-3.5 text-[#0F172A]" />}
              {currentUser.role === 'technician' && <Wrench className="w-3.5 h-3.5 text-[#D97706]" />}
              {currentUser.role === 'resident' && <User className="w-3.5 h-3.5 text-[#16A34A]" />}

              <span className="hidden sm:inline">
                {currentUser.role === 'admin'
                  ? 'Facility Admin'
                  : currentUser.role === 'technician'
                  ? 'Repair Worker'
                  : 'Resident'}
              </span>

              <ChevronDown className="w-3 h-3 text-[#64748B] ml-0.5" />
            </button>

            {/* Role Menu Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white text-[#0F172A] rounded-xl shadow-md border border-[#E2E8F0] p-1.5 z-50 animate-fade-in">
                <div className="px-2.5 py-1 border-b border-[#F1F5F9] mb-1">
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Switch role perspective
                  </p>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      switchRole('admin');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      currentUser.role === 'admin'
                        ? 'bg-[#F1F5F9] font-semibold text-[#0F172A]'
                        : 'hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>Facility Admin</span>
                    </div>
                    {currentUser.role === 'admin' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('technician');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      currentUser.role === 'technician'
                        ? 'bg-[#F1F5F9] font-semibold text-[#0F172A]'
                        : 'hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Repair Worker</span>
                    </div>
                    {currentUser.role === 'technician' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('resident');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      currentUser.role === 'resident'
                        ? 'bg-[#F1F5F9] font-semibold text-[#0F172A]'
                        : 'hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Resident</span>
                    </div>
                    {currentUser.role === 'resident' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0] cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-medium text-xs">
                {currentUser.avatarInitials}
              </div>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white text-[#0F172A] rounded-xl shadow-md border border-[#E2E8F0] p-2 z-50 animate-fade-in">
                <div className="px-2.5 py-1.5 border-b border-[#F1F5F9] mb-1">
                  <p className="text-xs font-semibold text-[#0F172A]">{currentUser.name}</p>
                  <p className="text-[11px] text-[#64748B]">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium">
                    {currentUser.roleTitle}
                  </span>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setCurrentPage('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>System Settings</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-[#B2463F] hover:bg-[#FDF2F2] rounded flex items-center gap-2 font-medium mt-1 border-t border-[#F0EFEA] pt-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1726]/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white text-[#1A2430] w-full max-w-xl rounded-lg shadow-xl border border-[#E8E6E1] overflow-hidden animate-pop-in">
            <div className="p-3 border-b border-[#E8E6E1] flex items-center gap-3 bg-[#FAF9F7]">
              <Search className="w-4 h-4 text-[#2C5B83]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by facility name, ID (e.g. BLD-102), zone, or alert..."
                className="flex-1 text-xs outline-none text-[#1A2430] placeholder:text-[#94A3B8] bg-transparent"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 text-[#707972] hover:text-[#1A2430] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto space-y-4">
              {searchQuery.trim() === '' ? (
                <div className="p-6 text-center text-xs text-[#707972]">
                  Type to search across buildings, active alerts, and inspections.
                </div>
              ) : (
                <>
                  {filteredBuildings.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-[#707972] uppercase tracking-wider px-2">
                        Buildings ({filteredBuildings.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {filteredBuildings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setCurrentPage('buildings');
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-lg hover:bg-[#FAF9F7] flex items-center justify-between cursor-pointer border border-transparent hover:border-[#E8E6E1] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Building2 className="w-4 h-4 text-[#2C5B83]" />
                              <div>
                                <p className="text-xs font-semibold text-[#1A2430]">{b.name}</p>
                                <p className="text-[10px] text-[#707972]">
                                  {b.id} • {b.zone} • {b.category}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-medium text-[#1A2430]">
                              {b.currentDailyLitres.toLocaleString()} L/day
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredAlerts.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-[#707972] uppercase tracking-wider px-2">
                        Alerts ({filteredAlerts.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {filteredAlerts.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSelectedAlertId(a.id);
                              setCurrentPage('alerts');
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-lg hover:bg-[#FAF9F7] flex items-center justify-between cursor-pointer border border-transparent hover:border-[#E8E6E1] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-[#B2463F]" />
                              <div>
                                <p className="text-xs font-semibold text-[#1A2430]">
                                  {a.buildingName} - {a.ruleName}
                                </p>
                                <p className="text-[10px] text-[#707972]">
                                  {a.id} • {a.severity} Severity
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#B2463F]">
                              +{a.estimatedExcessLitres.toLocaleString()} L excess
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredBuildings.length === 0 && filteredAlerts.length === 0 && (
                    <div className="p-6 text-center text-xs text-[#707972]">
                      No matching buildings or alerts found for "{searchQuery}".
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
