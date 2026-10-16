import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Droplets,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const DemoScenarioRunner: React.FC = () => {
  const {
    readings,
    buildings,
    alerts,
    inspections,
    importReadings,
    createInspection,
    recordRepair,
    verifyInspectionRepair,
    resetToDemoData,
    setCurrentPage,
    setSelectedBuildingId,
    showToast,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Scenario 1: Step 1 - Trigger Midnight Leak in BLD-102 (Hostel Block C)
  const handleTriggerHostelLeak = () => {
    setIsSimulating(true);

    const now = new Date('2026-10-12T22:00:00+08:00').getTime();
    const injectedReadings = [];

    for (let h = 1; h <= 6; h++) {
      const pointTime = new Date(now - h * 3600 * 1000).toISOString();
      injectedReadings.push({
        id: `INJ-HOSTEL-${Date.now()}-${h}`,
        buildingId: 'BLD-102',
        meterId: 'MTR-102-KK5',
        timestamp: pointTime,
        consumptionLitres: 185,
        expectedLitres: 15,
        isAnomalous: true,
        anomalyRule: 'CONTINUOUS_OVERNIGHT' as const,
      });
    }

    importReadings(injectedReadings);

    setTimeout(() => {
      setIsSimulating(false);
      setActiveStep(1);
      setSelectedBuildingId('BLD-102');
      setCurrentPage('alerts');
      showToast('Nocturnal Continuous Flow Alert Triggered on BLD-102 (+185 L/hr)!');
    }, 400);
  };

  // Scenario 1: Step 2 - Dispatch Plumber Ahmad
  const handleDispatchPlumber = () => {
    setIsSimulating(true);

    const relatedAlert = alerts.find(
      (a) => a.buildingId === 'BLD-102' && a.status !== 'Resolved'
    );

    const newInspection = createInspection({
      buildingId: 'BLD-102',
      alertId: relatedAlert?.id,
      assignedInspector: 'Ahmad Faiz (Senior Plumber)',
      dueDate: new Date().toISOString().slice(0, 10),
      urgencyReason: 'Urgent: Overnight continuous flow of 185 L/hr detected in Hostel Block C washrooms.',
      recommendedAction: 'Inspect Level 3 toilet flapper valves and secondary isolation risers.',
    });

    setTimeout(() => {
      setIsSimulating(false);
      setActiveStep(2);
      setCurrentPage('maintenance');
      showToast(`Work Order ${newInspection.id} dispatched to Plumber Ahmad Faiz!`);
    }, 400);
  };

  // Scenario 1: Step 3 - Plumber logs repair & telemetry verifies -92% drop
  const handleCompleteRepairAndVerify = () => {
    setIsSimulating(true);

    const bldInspection = inspections.find((i) => i.buildingId === 'BLD-102');
    const inspId = bldInspection ? bldInspection.id : 'INS-102-001';

    recordRepair(inspId, {
      repairDescription: 'Replaced 4 perished flapper seals on Level 3 washroom cisterns; tightened ballcock valve.',
      completedAt: new Date().toISOString(),
      technician: 'Ahmad Faiz',
      partsReplaced: 'Fluidmaster 2-inch flappers x4, Teflon seal tape',
      costRM: 140,
    });

    verifyInspectionRepair(inspId);

    // Inject low restored readings for BLD-102
    const now = new Date('2026-10-12T23:00:00+08:00').getTime();
    const restoredReadings = [];

    for (let h = 1; h <= 4; h++) {
      const pointTime = new Date(now + h * 3600 * 1000).toISOString();
      restoredReadings.push({
        id: `REST-HOSTEL-${Date.now()}-${h}`,
        buildingId: 'BLD-102',
        meterId: 'MTR-102-KK5',
        timestamp: pointTime,
        consumptionLitres: 14,
        expectedLitres: 15,
        isAnomalous: false,
      });
    }

    importReadings(restoredReadings);

    setTimeout(() => {
      setIsSimulating(false);
      setActiveStep(3);
      showToast('Repair Verified! Flow restored to 14 L/hr. +3,840 L/day saved!');
    }, 400);
  };

  const handleReset = () => {
    resetToDemoData();
    setActiveStep(0);
    setCurrentPage('overview');
    showToast('Reset all campus facilities and telemetry to baseline state.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden font-sans">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md shadow-md border border-[#2563EB] text-xs font-medium transition-all cursor-pointer"
          title="Open Pitch Demo Scenario Controller"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Demo Controller</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8] ml-0.5" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] w-80 sm:w-92 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span className="font-semibold text-xs text-white">Live Presentation Controller</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[#94A3B8] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <p className="text-[11px] text-[#64748B] leading-snug">
              Demonstrate the complete <strong>Anomaly $\to$ Alert $\to$ Dispatch $\to$ Verified Savings</strong> lifecycle:
            </p>

            {/* Scenario 1: Step-by-Step Flow */}
            <div className="space-y-2 border border-[#E2E8F0] rounded-md p-3 bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F2744] block">
                Scenario: Hostel Cistern Leak (BLD-102)
              </span>

              {/* Step 1 Button */}
              <button
                onClick={handleTriggerHostelLeak}
                disabled={isSimulating}
                className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs font-medium transition-all cursor-pointer ${
                  activeStep === 0
                    ? 'bg-[#B54747] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>1. Trigger Midnight Leak</span>
                </div>
                {activeStep >= 1 && <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />}
              </button>

              {/* Step 2 Button */}
              <button
                onClick={handleDispatchPlumber}
                disabled={isSimulating}
                className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs font-medium transition-all cursor-pointer ${
                  activeStep === 1
                    ? 'bg-[#B9822B] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>2. Dispatch Plumber Ahmad</span>
                </div>
                {activeStep >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />}
              </button>

              {/* Step 3 Button */}
              <button
                onClick={handleCompleteRepairAndVerify}
                disabled={isSimulating}
                className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs font-medium transition-all cursor-pointer ${
                  activeStep === 2
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>3. Complete Repair & Verify</span>
                </div>
                {activeStep >= 3 && <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />}
              </button>
            </div>

            {/* Quick Reset */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#64748B]">
                Reset environment?
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[#0F172A] hover:text-black font-medium bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-md transition-colors cursor-pointer border border-[#E2E8F0]"
              >
                <RotateCcw className="w-3 h-3 text-[#64748B]" />
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
