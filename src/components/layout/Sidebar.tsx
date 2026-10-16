import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import {
  LayoutDashboard,
  Building2,
  LineChart,
  AlertTriangle,
  ClipboardList,
  Wrench,
  Settings,
  Droplet,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { AquaSentinelLogo } from '../common/AquaSentinelLogo';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const { currentPage, setCurrentPage, alerts, inspections, currentUser, residentReports, themeMode } = useApp();

  const residentBuildingId = currentUser.assignedBuildingId || 'BLD-102';

  // Badges calculation scoped by role
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

  // Adaptive nav items based on role
  const navItems: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeStyle?: string;
  }> = [];

  if (currentUser.role === 'resident') {
    navItems.push(
      {
        id: 'resident_portal',
        label: 'Resident Portal',
        icon: User,
        badge: residentTicketsCount > 0 ? residentTicketsCount : undefined,
        badgeStyle: 'bg-[#2563EB] text-white',
      },
      {
        id: 'monitoring',
        label: 'Water Monitoring',
        icon: LineChart,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        badgeStyle: 'bg-[#DC2626] text-white',
      },
      {
        id: 'maintenance',
        label: 'Maintenance & Repairs',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#D97706] text-white',
      }
    );
  } else if (currentUser.role === 'technician') {
    navItems.push(
      {
        id: 'technician_view',
        label: 'Repair Work Orders',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#D97706] text-white',
      },
      { id: 'maintenance', label: 'Maintenance History', icon: ClipboardList },
      { id: 'monitoring', label: 'Water Monitoring', icon: LineChart },
      { id: 'buildings', label: 'Buildings', icon: Building2 }
    );
  } else {
    // Admin: Full campus overview and management (Impact Reports, Data Management, Technician View, and Resident Portal removed)
    navItems.push(
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'buildings', label: 'Buildings', icon: Building2 },
      { id: 'monitoring', label: 'Water Monitoring', icon: LineChart },
      {
        id: 'alerts',
        label: 'Leak Alerts',
        icon: AlertTriangle,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        badgeStyle: 'bg-[#DC2626] text-white',
      },
      {
        id: 'queue',
        label: 'Inspection Queue',
        icon: ClipboardList,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
        badgeStyle: 'bg-[#D97706] text-white',
      },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'settings', label: 'Settings', icon: Settings }
    );
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-200 bg-[#0F2744] text-[#F8FAFC] flex flex-col border-r border-[#1E3A5F] select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E3A5F] bg-[#0A1B30]">
        <div
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
          onClick={() => setCurrentPage(currentUser.role === 'resident' ? 'resident_portal' : 'overview')}
        >
          <AquaSentinelLogo size="sm" showText={false} />
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className={`font-semibold text-white truncate ${
                themeMode === 'handcrafted' ? 'font-editorial text-base tracking-normal' : 'text-sm tracking-tight'
              }`}>
                Aqua Sentinel
              </span>
              <span className="text-[11px] text-[#94A3B8] truncate">
                {currentUser.role === 'admin'
                  ? 'Facility Admin'
                  : currentUser.role === 'technician'
                  ? 'Repair Worker'
                  : 'Resident'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white font-medium shadow-none'
                  : 'text-[#CBD5E1] hover:text-white hover:bg-[#163359]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-[#94A3B8]'
                }`}
              />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}

              {/* Badges */}
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono font-medium px-1.5 py-0.2 rounded flex-shrink-0 tabular-nums ${
                    item.badgeStyle || 'bg-[#2563EB] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-[#1E3A5F] bg-[#0A1B30]/80">
        {!collapsed ? (
          <div className="px-1 flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
            <span>Telemetry</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Telemetry Online" />
          </div>
        )}
      </div>
    </aside>
  );
};
