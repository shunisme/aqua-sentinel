import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import { AquaSentinelLogo } from '../common/AquaSentinelLogo';
import {
  LayoutDashboard,
  Building2,
  LineChart,
  AlertTriangle,
  ClipboardList,
  Wrench,
  Settings,
  User,
  Search,
  CheckCircle2,
  Plus,
  ChevronDown,
  LogOut,
  X,
  Menu,
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
    inspections,
    residentReports,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';

  // Badges calculation
  const relevantAlerts = currentUser.role === 'resident'
    ? alerts.filter((a) => a.buildingId === residentBuildingId)
    : alerts;

  const activeAlertsCount = relevantAlerts.filter(
    (a) => a.status !== 'Resolved' && a.status !== 'False Positive'
  ).length;

  const relevantInspections = currentUser.role === 'resident'
    ? inspections.filter((i) => i.buildingId === residentBuildingId)
    : inspections;

  const openInspectionsCount = relevantInspections.filter(
    (i) => i.status !== 'Verified' && i.status !== 'False Positive' && i.status !== 'Closed Without Repair'
  ).length;

  const residentTicketsCount = residentReports.filter(
    (r) => r.buildingId === residentBuildingId
  ).length;

  // Adaptive top navigation tabs
  const navTabs: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeStyle?: string;
  }> = [];

  if (currentUser.role === 'resident') {
    navTabs.push(
      {
        id: 'resident_portal',
        label: 'Resident Portal',
        icon: User,
        badge: residentTicketsCount > 0 ? residentTicketsCount : undefined,
        badgeStyle: 'bg-[#2C5B83] text-white',
      },
      {
        id: 'monitoring',
        label: 'Water Monitoring',
        icon: LineChart,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        badgeStyle: 'bg-[#B2463F] text-white',
      },
      {
        id: 'maintenance',
        label: 'Maintenance & Repairs',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#B27B2A] text-white',
      }
    );
  } else if (currentUser.role === 'technician') {
    navTabs.push(
      {
        id: 'technician_view',
        label: 'Repair Work Orders',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#B27B2A] text-white',
      },
      { id: 'maintenance', label: 'Maintenance History', icon: ClipboardList },
      { id: 'monitoring', label: 'Water Monitoring', icon: LineChart },
      { id: 'buildings', label: 'Buildings', icon: Building2 }
    );
  } else {
    // Admin Top Navigation
    navTabs.push(
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'buildings', label: 'Buildings', icon: Building2 },
      { id: 'monitoring', label: 'Water Monitoring', icon: LineChart },
      {
        id: 'alerts',
        label: 'Leak Alerts',
        icon: AlertTriangle,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        badgeStyle: 'bg-[#B2463F] text-white',
      },
      {
        id: 'queue',
        label: 'Inspection Queue',
        icon: ClipboardList,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#B27B2A] text-white',
      },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'settings', label: 'Settings', icon: Settings }
    );
  }

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
    <header className="sticky top-0 z-30 bg-[#1A2838] text-white border-b border-[#2A3C50] shadow-sm select-none">
      {/* Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-6 z-50 bg-[#0B1726] text-white text-xs px-3.5 py-2 rounded-md shadow-md flex items-center gap-2 border border-[#2C5B83] animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Redesigned Aqua Sentinel Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer flex-shrink-0"
            onClick={() => setCurrentPage(currentUser.role === 'resident' ? 'resident_portal' : 'overview')}
            title="Return to home dashboard"
          >
            <AquaSentinelLogo size="md" showText={false} />
            <div className="flex flex-col">
              <span className="font-editorial font-bold text-lg text-white tracking-tight leading-none">
                Aqua Sentinel
              </span>
              <span className="text-[10px] text-[#89B3D9] font-mono mt-0.5">
                Water Intelligence Platform
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2C5B83] text-white shadow-xs font-semibold'
                      : 'text-[#C5D7E8] hover:text-white hover:bg-[#25394E]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-[#89B3D9]'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold leading-none ${
                        item.badgeStyle || 'bg-[#2C5B83] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions, Role & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Quick Dispatch Action (For Admin & Technician) */}
            {currentUser.role !== 'resident' && (
              <button
                onClick={onOpenCreateInspection}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#2E6F56] hover:bg-[#265B46] text-white rounded-md text-xs font-medium transition-colors cursor-pointer shadow-xs border border-[#3E896E]"
                title="Create a new inspection order"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dispatch</span>
              </button>
            )}

            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 bg-[#25394E] hover:bg-[#304860] text-[#C5D7E8] hover:text-white rounded-md transition-colors border border-[#3A526E] cursor-pointer"
              title="Search campus facilities, meters & alerts"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Active Role Switcher */}
            <div className="relative" ref={roleRef}>
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#3A526E] bg-[#25394E] text-white hover:bg-[#304860] transition-colors cursor-pointer"
                title="Switch active role"
              >
                {currentUser.role === 'admin' && <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
                {currentUser.role === 'technician' && <Wrench className="w-3.5 h-3.5 text-[#F59E0B]" />}
                {currentUser.role === 'resident' && <User className="w-3.5 h-3.5 text-[#34D399]" />}

                <span className="hidden sm:inline">
                  {currentUser.role === 'admin'
                    ? 'Admin'
                    : currentUser.role === 'technician'
                    ? 'Repair'
                    : 'Resident'}
                </span>

                <ChevronDown className="w-3 h-3 text-[#89B3D9]" />
              </button>

              {/* Role Menu Dropdown */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white text-[#1A2430] rounded-md shadow-lg border border-[#E8E6E1] p-1.5 z-50 animate-pop-in">
                  <div className="px-2.5 py-1 border-b border-[#F0EFEA] mb-1">
                    <p className="text-[10px] font-semibold text-[#707972] uppercase tracking-wider">
                      Switch Role Perspective
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        switchRole('admin');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left text-xs transition-colors cursor-pointer ${
                        currentUser.role === 'admin'
                          ? 'bg-[#F4F8FA] font-bold text-[#2C5B83]'
                          : 'hover:bg-[#FAF9F7] text-[#1A2430]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#2C5B83]" />
                        <span>Facility Admin</span>
                      </div>
                      {currentUser.role === 'admin' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2C5B83]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        switchRole('technician');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left text-xs transition-colors cursor-pointer ${
                        currentUser.role === 'technician'
                          ? 'bg-[#FAF3E7] font-bold text-[#B27B2A]'
                          : 'hover:bg-[#FAF9F7] text-[#1A2430]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-[#B27B2A]" />
                        <span>Repair Worker</span>
                      </div>
                      {currentUser.role === 'technician' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B27B2A]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        switchRole('resident');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left text-xs transition-colors cursor-pointer ${
                        currentUser.role === 'resident'
                          ? 'bg-[#F4F8FA] font-bold text-[#2C5B83]'
                          : 'hover:bg-[#FAF9F7] text-[#1A2430]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#2C5B83]" />
                        <span>Resident</span>
                      </div>
                      {currentUser.role === 'resident' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2C5B83]" />
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
                className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-md hover:bg-[#25394E] transition-colors border border-transparent hover:border-[#3A526E] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#2C5B83] border border-[#38BDF8]/40 flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.avatarInitials}
                </div>
                <ChevronDown className="w-3 h-3 text-[#89B3D9]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white text-[#1A2430] rounded-md shadow-lg border border-[#E8E6E1] p-2 z-50 animate-pop-in">
                  <div className="px-2.5 py-1.5 border-b border-[#F0EFEA] mb-1">
                    <p className="text-xs font-semibold text-[#1A2430]">{currentUser.name}</p>
                    <p className="text-[11px] text-[#707972]">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[#F4F8FA] text-[#2C5B83] border border-[#D2E0EC] font-medium">
                      {currentUser.roleTitle}
                    </span>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentPage('settings');
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-[#1A2430] hover:bg-[#FAF9F7] rounded cursor-pointer flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#707972]" />
                      <span>Platform Settings</span>
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

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-[#C5D7E8] hover:text-white rounded-md hover:bg-[#25394E] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#2A3C50] space-y-1 animate-pop-in">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2C5B83] text-white font-semibold'
                      : 'text-[#C5D7E8] hover:text-white hover:bg-[#25394E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#89B3D9]" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-[#B2463F] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
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
