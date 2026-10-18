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
    <div className={`min-h-screen text-[#1A2430] flex font-sans transition-colors duration-200 ${
      themeMode === 'handcrafted' ? 'bg-[#F9F9F8] theme-handcrafted' : 'bg-[#F8FAFC] theme-classic'
    }`}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header onOpenCreateInspection={() => handleOpenCreateInspection()} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-slide-up">
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
              <div className="bg-white p-8 rounded-lg border border-[#E8E6E1] text-center space-y-3 max-w-md mx-auto my-12 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#FDF2F2] border border-[#F8D7DA] flex items-center justify-center mx-auto text-[#B2463F]">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-editorial font-bold text-[#1A2430]">Access Restricted</h2>
                <p className="text-xs text-[#707972]">
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
        <footer className="px-6 py-4 bg-white border-t border-[#E8E6E1] text-xs text-[#707972] flex flex-wrap items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-editorial font-bold text-[#1A2430]">Aqua Sentinel</span>
            <span>—</span>
            <span>Water Infrastructure Monitoring & Inspection Prioritisation</span>
          </div>
          <div className="flex items-center gap-3 text-[#707972] tabular-nums font-mono text-[11px]">
            <span>Deterministic Anomaly Engine</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-[#2E6F56] font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F56] animate-pulse" />
              Telemetry Sync Active
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
