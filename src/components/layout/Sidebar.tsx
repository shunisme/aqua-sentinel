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
      },
      {
        id: 'monitoring',
        label: 'Water Monitoring',
        icon: LineChart,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      },
      {
        id: 'maintenance',
        label: 'Maintenance & Repairs',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
      }
    );
  } else if (currentUser.role === 'technician') {
    navItems.push(
      {
        id: 'technician_view',
        label: 'Repair Work Orders',
        icon: Wrench,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
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
      },
      {
        id: 'queue',
        label: 'Inspection Queue',
        icon: ClipboardList,
        badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
      },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'settings', label: 'Settings', icon: Settings }
    );
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-[width] duration-200 bg-[#0F172A] text-white flex flex-col border-r border-[#1E293B] select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#1E293B]">
        <div
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          onClick={() => setCurrentPage(currentUser.role === 'resident' ? 'resident_portal' : 'overview')}
          title="Return to Dashboard"
        >
          <AquaSentinelLogo size="sm" showText={false} />
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-semibold text-sm text-[#F8FAFC] tracking-tight truncate">
                Aqua Sentinel
              </span>
              <span className="text-[10px] text-[#94A3B8] font-mono mt-1 truncate">
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
          className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-white font-medium'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-[#94A3B8]'
                  }`}
                />
              </div>

              {!collapsed && (
                <span className="flex-1 text-left truncate">
                  {item.label}
                </span>
              )}

              {/* Dynamic Badges */}
              {item.badge !== undefined && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 tabular-nums bg-[#1E293B] text-[#CBD5E1] border border-[#334155]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-[#1E293B]">
        {!collapsed ? (
          <div className="px-1 flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Telemetry</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#16A34A] text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Active
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" title="Telemetry active" />
          </div>
        )}
      </div>
    </aside>
  );
};
