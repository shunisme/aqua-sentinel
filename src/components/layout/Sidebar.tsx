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
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
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
  const { currentPage, setCurrentPage, alerts, inspections, currentUser, residentReports } = useApp();

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
    navItems.push(
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
    // Admin: Full campus overview and management
    navItems.push(
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

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-[#152232] text-white flex flex-col border-r border-[#233448] shadow-sm select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#233448] bg-[#101B29]">
        <div
          className="flex items-center gap-3 cursor-pointer overflow-hidden transition-opacity hover:opacity-95"
          onClick={() => setCurrentPage(currentUser.role === 'resident' ? 'resident_portal' : 'overview')}
          title="Return to Dashboard"
        >
          <AquaSentinelLogo size="sm" showText={false} />
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-editorial font-bold text-base text-white tracking-tight truncate">
                Aqua Sentinel
              </span>
              <span className="text-[10px] text-[#89B3D9] font-mono truncate">
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
          className="p-1.5 rounded-md text-[#89B3D9] hover:text-white hover:bg-[#1E3147] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer group ${
                isActive
                  ? 'bg-[#2C5B83] text-white font-semibold shadow-xs ring-1 ring-[#38BDF8]/20'
                  : 'text-[#B6C9DD] hover:text-white hover:bg-[#1C2C3F]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#38BDF8]' : 'text-[#89B3D9] group-hover:text-white'
                }`}
              />
              {!collapsed && (
                <span className="flex-1 text-left truncate tracking-normal">
                  {item.label}
                </span>
              )}

              {/* Dynamic Badges */}
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 tabular-nums shadow-xs ${
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

      {/* Footer / System Status */}
      <div className="p-3 border-t border-[#233448] bg-[#101B29]">
        {!collapsed ? (
          <div className="px-1 flex items-center justify-between text-[11px] text-[#89B3D9] font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Telemetry Sync</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-sans text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Telemetry Sync Active" />
          </div>
        )}
      </div>
    </aside>
  );
};
