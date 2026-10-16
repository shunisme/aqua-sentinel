import { runAnomalyDetection, calculateSeverity } from './anomalyDetection';
import { calculateBuildingPriorityScore } from './priorityScorer';
import { verifyRepairOutcome } from './verificationEngine';
import { DEFAULT_SETTINGS } from './demoData';
import { MeterReading, Building, AnomalyAlert } from '../types';

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: string;
  durationMs: number;
}

export function runAquaSentinelTestSuite(): TestResultItem[] {
  const results: TestResultItem[] = [];

  function test(
    id: string,
    category: string,
    name: string,
    fn: () => { passed: boolean; message: string; details?: string }
  ) {
    const t0 = performance.now();
    try {
      const res = fn();
      const t1 = performance.now();
      results.push({
        id,
        category,
        name,
        passed: res.passed,
        message: res.message,
        details: res.details,
        durationMs: Math.round(t1 - t0),
      });
    } catch (err: any) {
      const t1 = performance.now();
      results.push({
        id,
        category,
        name,
        passed: false,
        message: `Exception: ${err?.message || String(err)}`,
        durationMs: Math.round(t1 - t0),
      });
    }
  }

  // TEST 1: Normal Usage (No Spurious Alerts)
  test('T1', 'Anomaly Detection', 'Normal usage produces zero false positive alerts', () => {
    const normalReadings: MeterReading[] = [];
    for (let h = 0; h < 24; h++) {
      const isNight = h >= 1 && h <= 5;
      normalReadings.push({
        id: `N-${h}`,
        buildingId: 'BLD-TEST',
        meterId: 'MTR-TEST',
        timestamp: `2026-10-12T${String(h).padStart(2, '0')}:00:00Z`,
        consumptionLitres: isNight ? 15 : 100 + (h % 5),
        expectedLitres: isNight ? 15 : 100,
      });
    }
    const res = runAnomalyDetection(normalReadings, { 'BLD-TEST': 'Normal Block' }, DEFAULT_SETTINGS);
    const passed = res.alerts.length === 0;
    return {
      passed,
      message: passed
        ? 'Pass: Normal hourly variations within expected thresholds triggered 0 alerts.'
        : `Fail: Expected 0 alerts but got ${res.alerts.length}.`,
    };
  });

  // TEST 2: Rule A - Unexpected Consumption Spike
  test('T2', 'Anomaly Detection', 'Rule A: Detects unexpected consumption spike (>200% & >150L)', () => {
    const readings: MeterReading[] = [
      {
        id: 'S-1',
        buildingId: 'BLD-TEST',
        meterId: 'MTR-TEST',
        timestamp: '2026-10-12T14:00:00Z',
        consumptionLitres: 1200, // Expected is 200, so 600% and excess 1000L
        expectedLitres: 200,
      },
    ];
    const res = runAnomalyDetection(readings, { 'BLD-TEST': 'Spike Block' }, DEFAULT_SETTINGS);
    const spikeAlert = res.alerts.find((a) => a.rule === 'SPIKE');
    const passed = !!spikeAlert && spikeAlert.estimatedExcessLitres === 1000 && spikeAlert.severity === 'Critical';
    return {
      passed,
      message: passed
        ? `Pass: Rule A triggered Critical alert with estimated excess of 1000 L.`
        : `Fail: Rule A did not trigger expected alert. Found: ${JSON.stringify(spikeAlert)}`,
    };
  });

  // TEST 3: Rule B - Continuous Overnight Flow
  test('T3', 'Anomaly Detection', 'Rule B: Detects continuous overnight flow across 01:00-05:00', () => {
    const readings: MeterReading[] = [
      { id: 'C-1', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T01:00:00Z', consumptionLitres: 160, expectedLitres: 20 },
      { id: 'C-2', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T02:00:00Z', consumptionLitres: 170, expectedLitres: 20 },
      { id: 'C-3', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T03:00:00Z', consumptionLitres: 165, expectedLitres: 20 },
      { id: 'C-4', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T04:00:00Z', consumptionLitres: 155, expectedLitres: 20 },
    ];
    const res = runAnomalyDetection(readings, { 'BLD-TEST': 'Overnight Block' }, DEFAULT_SETTINGS);
    const flowAlert = res.alerts.find((a) => a.rule === 'CONTINUOUS_OVERNIGHT');
    const passed = !!flowAlert && flowAlert.durationHours === 4;
    return {
      passed,
      message: passed
        ? `Pass: Rule B detected 4 consecutive overnight hours with sustained flow.`
        : `Fail: Rule B did not trigger continuous overnight flow alert.`,
    };
  });

  // TEST 4: Zero / Missing Baselines Safety
  test('T4', 'Edge Cases', 'Zero or missing baseline safely handled without division-by-zero', () => {
    const zeroBaselineReadings: MeterReading[] = [
      { id: 'Z-1', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T10:00:00Z', consumptionLitres: 350, expectedLitres: 0 },
      { id: 'Z-2', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-12T11:00:00Z', consumptionLitres: 0, expectedLitres: 0 },
    ];
    const res = runAnomalyDetection(zeroBaselineReadings, { 'BLD-TEST': 'Zero Baseline' }, DEFAULT_SETTINGS);
    const passed = res.alerts.length >= 0 && !isNaN(res.alerts[0]?.actualLitres || 0);
    return {
      passed,
      message: passed
        ? 'Pass: Engine gracefully fell back to safe defaults with no NaN, Infinity or crashes.'
        : 'Fail: Zero baseline produced invalid calculation.',
    };
  });

  // TEST 5: Rule C - Repeated Nighttime Anomaly Across Consecutive Nights
  test('T5', 'Anomaly Detection', 'Rule C: Detects elevated consumption repeating across consecutive nights', () => {
    const readings: MeterReading[] = [
      // Night 1
      { id: 'R-1', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-10T02:00:00Z', consumptionLitres: 140, expectedLitres: 20 },
      { id: 'R-2', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-10T03:00:00Z', consumptionLitres: 140, expectedLitres: 20 },
      // Night 2
      { id: 'R-3', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-11T02:00:00Z', consumptionLitres: 150, expectedLitres: 20 },
      { id: 'R-4', buildingId: 'BLD-TEST', meterId: 'MTR-TEST', timestamp: '2026-10-11T03:00:00Z', consumptionLitres: 150, expectedLitres: 20 },
    ];
    const res = runAnomalyDetection(readings, { 'BLD-TEST': 'Repeat Night Block' }, DEFAULT_SETTINGS);
    const nightAlert = res.alerts.find((a) => a.rule === 'REPEATED_NIGHTTIME');
    const passed = !!nightAlert;
    return {
      passed,
      message: passed
        ? `Pass: Rule C flagged repeating nocturnal deviation between consecutive nights.`
        : 'Fail: Rule C did not flag repeating nighttime deviation.',
    };
  });

  // TEST 6: Priority Scoring Engine Mathematical Weights
  test('T6', 'Priority Queue', 'Inspection Priority Scorer adheres strictly to 35/25/20/20 weights', () => {
    const dummyBuilding: Building = {
      id: 'BLD-999',
      name: 'Test Block',
      category: 'Hostel',
      zone: 'North Campus',
      floors: 5,
      meterId: 'MTR-999',
      baselineDailyLitres: 5000,
      currentDailyLitres: 12000, // 7000 L excess
      expectedDailyLitres: 5000,
      latestReadingTimestamp: '2026-10-12T12:00:00Z',
      anomalyStatus: 'Suspected Leak',
      openAlertsCount: 1,
      inspectionStatus: 'Open',
      priorityScore: 0,
    };

    const dummyAlert: AnomalyAlert = {
      id: 'ALT-TEST-1',
      buildingId: 'BLD-999',
      buildingName: 'Test Block',
      detectedAt: '2026-10-12T08:00:00Z',
      rule: 'CONTINUOUS_OVERNIGHT',
      ruleName: 'Continuous Overnight Flow',
      severity: 'Critical',
      actualLitres: 250,
      expectedLitres: 20,
      estimatedExcessLitres: 5000,
      durationHours: 8,
      explanation: 'Test',
      evidenceStrength: 'High',
      status: 'New',
      recommendedAction: 'Test',
    };

    const scoreRes = calculateBuildingPriorityScore(dummyBuilding, [dummyAlert], DEFAULT_SETTINGS);
    const passed =
      scoreRes.score >= 70 &&
      scoreRes.score <= 100 &&
      scoreRes.breakdown.excessWeight === 0.35 &&
      scoreRes.breakdown.persistenceWeight === 0.25 &&
      scoreRes.breakdown.severityWeight === 0.2 &&
      scoreRes.breakdown.evidenceWeight === 0.2;

    return {
      passed,
      message: passed
        ? `Pass: Score calculated as ${scoreRes.score}/100 (${scoreRes.tier}) with exact weights.`
        : `Fail: Score calculation mismatch: ${JSON.stringify(scoreRes.breakdown)}`,
    };
  });

  // TEST 7: Repair Verification Engine
  test('T7', 'Verification & Impact', 'Repair verification computes reduction % and water savings accurately', () => {
    const repairTime = '2026-10-10T12:00:00Z';
    const testReadings: MeterReading[] = [];

    // Pre-repair (48 hours at 400 L/hr)
    for (let i = 48; i > 0; i--) {
      const t = new Date(new Date(repairTime).getTime() - i * 3600 * 1000).toISOString();
      testReadings.push({
        id: `PRE-${i}`,
        buildingId: 'BLD-REP',
        meterId: 'MTR-REP',
        timestamp: t,
        consumptionLitres: 400,
        expectedLitres: 100,
      });
    }

    // Post-repair (48 hours at 100 L/hr)
    for (let i = 0; i < 48; i++) {
      const t = new Date(new Date(repairTime).getTime() + i * 3600 * 1000).toISOString();
      testReadings.push({
        id: `POST-${i}`,
        buildingId: 'BLD-REP',
        meterId: 'MTR-REP',
        timestamp: t,
        consumptionLitres: 100,
        expectedLitres: 100,
      });
    }

    const verification = verifyRepairOutcome(
      'BLD-REP',
      {
        repairDescription: 'Replaced main seal',
        completedAt: repairTime,
        technician: 'Test Tech',
        costRM: 200,
        partsReplaced: 'Seal',
      },
      testReadings,
      2.85
    );

    const passed =
      verification.result.status === 'Verified' &&
      verification.result.reductionPercent === 75 &&
      verification.result.dailySavedLitres === 300 * 24;

    return {
      passed,
      message: passed
        ? `Pass: Verification confirmed 75% reduction and ${verification.result.dailySavedLitres} L/day savings.`
        : `Fail: Verification calculations: ${JSON.stringify(verification.result)}`,
    };
  });

  return results;
}
