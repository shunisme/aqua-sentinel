import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { OverviewPage } from './components/overview/OverviewPage';
import { BuildingsPage } from './components/buildings/BuildingsPage';
import { WaterMonitoringPage } from './components/monitoring/WaterMonitoringPage';
import { LeakAlertsPage } from './components/alerts/LeakAlertsPage';
import { InspectionQueuePage } from './components/inspections/InspectionQueuePage';
import { MaintenancePage } from './components/maintenance/MaintenancePage';
import { ImpactReportsPage } from './components/impact/ImpactReportsPage';
import { DataManagementPage } from './components/data/DataManagementPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ResidentPortalPage } from './components/resident/ResidentPortalPage';
import { TechnicianDashboardPage } from './components/technician/TechnicianDashboardPage';
import { CreateInspectionModal } from './components/maintenance/CreateInspectionModal';
import { DemoScenarioRunner } from './components/common/DemoScenarioRunner';
import { Lock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentPage, isAuthenticated, currentUser, themeMode } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateInspectionOpen, setIsCreateInspectionOpen] = useState(false);
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);
  const [targetAlertId, setTargetAlertId] = useState<string | null>(null);

  const handleOpenCreateInspection = (buildingId?: string, alertId?: string) => {
    setTargetBuildingId(buildingId || null);
    setTargetAlertId(alertId || null);
    setIsCreateInspectionOpen(true);
  };

  // If user is not authenticated or hasn't selected a session
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen text-[#0F172A] flex font-sans bg-[#F8FAFC]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Header onOpenCreateInspection={() => handleOpenCreateInspection()} />

        <main className="flex-1 p-6 w-full max-w-[1536px] animate-fade-in">
          {currentPage === 'overview' && (
            currentUser.role === 'resident' ? (
              <ResidentPortalPage />
            ) : (
              <OverviewPage onOpenCreateInspection={(bId, aId) => handleOpenCreateInspection(bId, aId)} />
            )
          )}
          {currentPage === 'buildings' && (
            currentUser.role === 'resident' ? (
              <ResidentPortalPage />
            ) : (
              <BuildingsPage onOpenCreateInspection={(bId) => handleOpenCreateInspection(bId)} />
            )
          )}
          {currentPage === 'monitoring' && <WaterMonitoringPage />}
          {currentPage === 'alerts' && (
            currentUser.role === 'resident' ? (
              <WaterMonitoringPage />
            ) : (
              <LeakAlertsPage
                onOpenCreateInspection={(bId, aId) => handleOpenCreateInspection(bId, aId)}
              />
            )
          )}
          {currentPage === 'queue' && (
            currentUser.role === 'resident' ? (
              <MaintenancePage onOpenCreateInspection={() => handleOpenCreateInspection()} />
            ) : (
              <InspectionQueuePage onOpenCreateInspection={(bId) => handleOpenCreateInspection(bId)} />
            )
          )}
          {currentPage === 'maintenance' && (
            <MaintenancePage onOpenCreateInspection={() => handleOpenCreateInspection()} />
          )}
          {(currentPage === 'impact' || currentPage === 'data') && (
            <OverviewPage onOpenCreateInspection={(bId, aId) => handleOpenCreateInspection(bId, aId)} />
          )}
          {currentPage === 'settings' && (
            currentUser.role === 'admin' ? (
              <SettingsPage />
            ) : (
              <div className="bg-white p-8 rounded-lg border border-[#E2E8F0] text-center space-y-3 max-w-md mx-auto my-12 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-[#0F172A]">Access Restricted</h2>
                <p className="text-xs text-[#64748B]">
                  Platform settings and system configuration are restricted to Facility Administrators only.
                </p>
              </div>
            )
          )}
          {currentPage === 'resident_portal' && <ResidentPortalPage />}
          {currentPage === 'technician_view' && (
            <TechnicianDashboardPage
              onOpenCreateInspection={(bId) => handleOpenCreateInspection(bId)}
            />
          )}
        </main>

        {/* Enterprise Global Footer */}
        <footer className="px-6 py-4 bg-white border-t border-[#E2E8F0] text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0F172A]">Aqua Sentinel</span>
            <span className="text-[#94A3B8]">—</span>
            <span className="text-[#64748B]">Water telemetry and priority dispatch</span>
          </div>
          <div className="flex items-center gap-3 text-[#64748B] tabular-nums font-mono text-[11px]">
            <span>Deterministic engine</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Telemetry synchronized
            </span>
          </div>
        </footer>
      </div>

      {/* Dispatch Inspection Ticket Modal */}
      <CreateInspectionModal
        isOpen={isCreateInspectionOpen}
        onClose={() => {
          setIsCreateInspectionOpen(false);
          setTargetBuildingId(null);
          setTargetAlertId(null);
        }}
        defaultBuildingId={targetBuildingId}
        defaultAlertId={targetAlertId}
      />

      {/* Interactive Hackathon Pitch Demo Runner Widget */}
      <DemoScenarioRunner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
