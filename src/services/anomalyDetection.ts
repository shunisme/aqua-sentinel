import {
  MeterReading,
  AnomalyAlert,
  AppSettings,
  AlertSeverity,
  EvidenceStrength,
  DetectionRuleType,
} from '../types';

/**
 * Deterministic rule-based Anomaly Detection Engine for Aqua Sentinel.
 * Operates without random numbers or external APIs.
 */

export interface AnomalyDetectionResult {
  alerts: AnomalyAlert[];
  annotatedReadings: MeterReading[];
  summary: {
    totalReadingsEvaluated: number;
    anomaliesFound: number;
    spikesCount: number;
    continuousFlowCount: number;
    repeatedNightCount: number;
    totalPotentialExcessLitres: number;
  };
}

/**
 * Generates a stable, deterministic Alert ID based on building, rule, and timestamp window.
 */
export function generateAlertId(buildingId: string, rule: DetectionRuleType, dateStr: string): string {
  const cleanDate = dateStr.slice(0, 10).replace(/-/g, '');
  const prefix = rule === 'SPIKE' ? 'SPK' : rule === 'CONTINUOUS_OVERNIGHT' ? 'COF' : 'RNU';
  return `ALT-${cleanDate}-${prefix}-${buildingId.replace(/[^A-Za-z0-9]/g, '')}`;
}

/**
 * Calculate severity based on transparent rules:
 * - Potential excess volume
 * - Persistence/duration
 */
export function calculateSeverity(
  excessLitresPerHour: number,
  durationHours: number,
  rule: DetectionRuleType
): AlertSeverity {
  const dailyExcess = excessLitresPerHour * Math.min(24, Math.max(1, durationHours));

  if (dailyExcess >= 5000 || excessLitresPerHour >= 600) {
    return 'Critical';
  }
  if (dailyExcess >= 2000 || excessLitresPerHour >= 250 || (rule === 'CONTINUOUS_OVERNIGHT' && durationHours >= 4)) {
    return 'High';
  }
  if (dailyExcess >= 800 || excessLitresPerHour >= 100) {
    return 'Medium';
  }
  return 'Low';
}

/**
 * Evaluates readings for a building and detects anomalies using 3 deterministic rules:
 * Rule A: Unexpected Consumption Spike
 * Rule B: Continuous Overnight Flow
 * Rule C: Repeated Unusual Nighttime Usage
 */
export function runAnomalyDetection(
  readings: MeterReading[],
  buildingNames: Record<string, string>,
  settings: AppSettings,
  existingAlerts: AnomalyAlert[] = []
): AnomalyDetectionResult {
  if (!readings || readings.length === 0) {
    return {
      alerts: [],
      annotatedReadings: [],
      summary: {
        totalReadingsEvaluated: 0,
        anomaliesFound: 0,
        spikesCount: 0,
        continuousFlowCount: 0,
        repeatedNightCount: 0,
        totalPotentialExcessLitres: 0,
      },
    };
  }

  // Sort readings chronologically
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group readings by building
  const buildingReadingsMap = new Map<string, MeterReading[]>();
  for (const r of sorted) {
    const list = buildingReadingsMap.get(r.buildingId) || [];
    list.push({ ...r, isAnomalous: false, anomalyRule: undefined });
    buildingReadingsMap.set(r.buildingId, list);
  }

  const generatedAlerts: AnomalyAlert[] = [];
  const alertIdMap = new Map<string, AnomalyAlert>();

  // Map existing alerts to preserve user actions (e.g. Acknowledged, False Positive, Resolved)
  const existingAlertsMap = new Map<string, AnomalyAlert>();
  for (const ea of existingAlerts) {
    existingAlertsMap.set(ea.id, ea);
  }

  let totalSpikes = 0;
  let totalContinuous = 0;
  let totalRepeatedNight = 0;

  // Process each building
  for (const [buildingId, bReadings] of buildingReadingsMap.entries()) {
    const bName = buildingNames[buildingId] || buildingId;

    // --- RULE A: Unexpected Consumption Spike ---
    for (let i = 0; i < bReadings.length; i++) {
      const reading = bReadings[i];
      const actual = reading.consumptionLitres;
      // Safeguard against zero or missing baseline
      const expected = reading.expectedLitres > 0 ? reading.expectedLitres : 50;
      const excess = Math.max(0, actual - expected);

      const ratio = expected > 0 ? (actual / expected) * 100 : 0;
      const isSpikeRatio = ratio >= settings.spikeThresholdPercent;
      const isSpikeVolume = excess >= settings.minSpikeExcessLitres;

      if (isSpikeRatio && isSpikeVolume) {
        reading.isAnomalous = true;
        reading.anomalyRule = 'SPIKE';

        const alertId = generateAlertId(buildingId, 'SPIKE', reading.timestamp);
        if (!alertIdMap.has(alertId)) {
          const severity = calculateSeverity(excess, 1, 'SPIKE');
          const evidenceStrength: EvidenceStrength = ratio >= 300 ? 'High' : 'Moderate';

          const existing = existingAlertsMap.get(alertId);
          const resolvedHistoricAlert = Array.from(existingAlertsMap.values()).find(
            (a) =>
              a.buildingId === buildingId &&
              a.status === 'Resolved' &&
              a.resolvedAt &&
              new Date(reading.timestamp).getTime() <= new Date(a.resolvedAt).getTime()
          );

          const alert: AnomalyAlert = {
            id: alertId,
            buildingId,
            buildingName: bName,
            detectedAt: reading.timestamp,
            rule: 'SPIKE',
            ruleName: 'Unexpected Consumption Spike',
            severity,
            actualLitres: actual,
            expectedLitres: expected,
            estimatedExcessLitres: excess,
            durationHours: 1,
            explanation: `Hourly reading of ${Math.round(actual)} L exceeded expected baseline of ${Math.round(
              expected
            )} L by ${Math.round(ratio)}% (excess: +${Math.round(excess)} L). Exceeds configured spike threshold of ${settings.spikeThresholdPercent}%.`,
            evidenceStrength,
            status: existing ? existing.status : resolvedHistoricAlert ? 'Resolved' : 'New',
            recommendedAction:
              severity === 'Critical'
                ? 'Immediately dispatch technician to inspect main feed, pump lines, and water tanks.'
                : 'Inspect primary distribution valves and check for high-draw machinery or open taps.',
            supportingReadings: [
              {
                timestamp: reading.timestamp,
                actualLitres: actual,
                expectedLitres: expected,
              },
            ],
            falsePositiveReason: existing?.falsePositiveReason,
            resolutionNotes: existing?.resolutionNotes || resolvedHistoricAlert?.resolutionNotes,
            acknowledgedAt: existing?.acknowledgedAt,
            resolvedAt: existing?.resolvedAt || resolvedHistoricAlert?.resolvedAt,
            inspectionId: existing?.inspectionId || resolvedHistoricAlert?.inspectionId,
          };

          alertIdMap.set(alertId, alert);
          totalSpikes++;
        }
      }
    }

    // --- RULE B: Continuous Overnight Flow ---
    // Group readings by day and check consecutive low usage hours
    let consecutiveLowUsageReadings: MeterReading[] = [];

    for (let i = 0; i < bReadings.length; i++) {
      const reading = bReadings[i];
      const d = new Date(reading.timestamp);
      const hour = d.getHours();

      const isLowUsageHour =
        hour >= settings.lowUsageStartHour && hour <= settings.lowUsageEndHour;

      if (isLowUsageHour && reading.consumptionLitres >= settings.continuousFlowThresholdLitres) {
        consecutiveLowUsageReadings.push(reading);
      } else {
        // Evaluate the accumulated consecutive sequence
        if (consecutiveLowUsageReadings.length >= settings.continuousFlowMinHours) {
          triggerContinuousFlowAlert(
            consecutiveLowUsageReadings,
            buildingId,
            bName,
            settings,
            existingAlertsMap,
            alertIdMap
          );
          totalContinuous++;
        }
        consecutiveLowUsageReadings = [];
      }
    }
    // Flush trailing sequence
    if (consecutiveLowUsageReadings.length >= settings.continuousFlowMinHours) {
      triggerContinuousFlowAlert(
        consecutiveLowUsageReadings,
        buildingId,
        bName,
        settings,
        existingAlertsMap,
        alertIdMap
      );
      totalContinuous++;
    }

    // --- RULE C: Repeated Unusual Nighttime Usage ---
    // Compare nighttime consumption across consecutive nights
    // Map night blocks: Key is date string (YYYY-MM-DD), value is readings in low-usage hours
    const nightGroups = new Map<string, MeterReading[]>();
    for (const r of bReadings) {
      const d = new Date(r.timestamp);
      const h = d.getHours();
      if (h >= settings.lowUsageStartHour && h <= settings.lowUsageEndHour) {
        const dateKey = r.timestamp.slice(0, 10);
        const list = nightGroups.get(dateKey) || [];
        list.push(r);
        nightGroups.set(dateKey, list);
      }
    }

    const nightDates = Array.from(nightGroups.keys()).sort();
    for (let i = 1; i < nightDates.length; i++) {
      const prevDate = nightDates[i - 1];
      const currDate = nightDates[i];
      const prevReadings = nightGroups.get(prevDate) || [];
      const currReadings = nightGroups.get(currDate) || [];

      const avgPrevActual =
        prevReadings.length > 0
          ? prevReadings.reduce((sum, r) => sum + r.consumptionLitres, 0) / prevReadings.length
          : 0;
      const avgCurrActual =
        currReadings.length > 0
          ? currReadings.reduce((sum, r) => sum + r.consumptionLitres, 0) / currReadings.length
          : 0;

      const avgCurrExpected =
        currReadings.length > 0
          ? currReadings.reduce((sum, r) => sum + (r.expectedLitres || 20), 0) / currReadings.length
          : 20;

      const safeExpected = avgCurrExpected > 0 ? avgCurrExpected : 20;
      const ratio = (avgCurrActual / safeExpected) * 100;

      // Both consecutive nights must show elevated nighttime consumption
      if (
        ratio >= settings.repeatedNightThresholdPercent &&
        avgPrevActual > safeExpected * 1.2 &&
        avgCurrActual - safeExpected >= 60
      ) {
        const alertId = generateAlertId(buildingId, 'REPEATED_NIGHTTIME', currDate);
        if (!alertIdMap.has(alertId)) {
          const duration = currReadings.length;
          const excessPerHour = Math.max(0, avgCurrActual - safeExpected);
          const totalExcess = Math.round(excessPerHour * duration);
          const severity = calculateSeverity(excessPerHour, duration, 'REPEATED_NIGHTTIME');

          const existing = existingAlertsMap.get(alertId);
          const resolvedHistoricAlert = Array.from(existingAlertsMap.values()).find(
            (a) =>
              a.buildingId === buildingId &&
              a.status === 'Resolved' &&
              a.resolvedAt &&
              new Date(currReadings[0]?.timestamp || `${currDate}T02:00:00Z`).getTime() <= new Date(a.resolvedAt).getTime()
          );

          // Mark readings as anomalous
          currReadings.forEach((r) => {
            r.isAnomalous = true;
            r.anomalyRule = 'REPEATED_NIGHTTIME';
          });

          const alert: AnomalyAlert = {
            id: alertId,
            buildingId,
            buildingName: bName,
            detectedAt: currReadings[0]?.timestamp || `${currDate}T02:00:00Z`,
            rule: 'REPEATED_NIGHTTIME',
            ruleName: 'Repeated Unusual Nighttime Usage',
            severity,
            actualLitres: Math.round(avgCurrActual),
            expectedLitres: Math.round(safeExpected),
            estimatedExcessLitres: totalExcess,
            durationHours: duration,
            explanation: `Nighttime consumption averaged ${Math.round(
              avgCurrActual
            )} L/hr over ${duration} low-usage hours (expected ${Math.round(
              safeExpected
            )} L/hr, +${Math.round(ratio - 100)}% elevation) across 2+ consecutive nights (${prevDate} & ${currDate}).`,
            evidenceStrength: 'High',
            status: existing ? existing.status : resolvedHistoricAlert ? 'Resolved' : 'New',
            recommendedAction:
              'Check for recurrent nocturnal automated processes, faulty cistern ball valves, or hidden sub-meter leaks.',
            supportingReadings: currReadings.map((r) => ({
              timestamp: r.timestamp,
              actualLitres: r.consumptionLitres,
              expectedLitres: r.expectedLitres,
            })),
            falsePositiveReason: existing?.falsePositiveReason,
            resolutionNotes: existing?.resolutionNotes || resolvedHistoricAlert?.resolutionNotes,
            acknowledgedAt: existing?.acknowledgedAt,
            resolvedAt: existing?.resolvedAt || resolvedHistoricAlert?.resolvedAt,
            inspectionId: existing?.inspectionId || resolvedHistoricAlert?.inspectionId,
          };

          alertIdMap.set(alertId, alert);
          totalRepeatedNight++;
        }
      }
    }
  }

  function triggerContinuousFlowAlert(
    consecutiveReadings: MeterReading[],
    buildingId: string,
    buildingName: string,
    currentSettings: AppSettings,
    existingMap: Map<string, AnomalyAlert>,
    alertMap: Map<string, AnomalyAlert>
  ) {
    const firstReading = consecutiveReadings[0];
    const alertId = generateAlertId(buildingId, 'CONTINUOUS_OVERNIGHT', firstReading.timestamp);

    consecutiveReadings.forEach((r) => {
      r.isAnomalous = true;
      r.anomalyRule = 'CONTINUOUS_OVERNIGHT';
    });

    if (alertMap.has(alertId)) return;

    const duration = consecutiveReadings.length;
    const totalActual = consecutiveReadings.reduce((sum, r) => sum + r.consumptionLitres, 0);
    const totalExpected = consecutiveReadings.reduce((sum, r) => sum + (r.expectedLitres || 15), 0);
    const avgActual = Math.round(totalActual / duration);
    const avgExpected = Math.round(totalExpected / duration);
    const excessPerHour = Math.max(0, avgActual - avgExpected);
    const totalExcess = Math.round(excessPerHour * duration);

    const severity = calculateSeverity(excessPerHour, duration, 'CONTINUOUS_OVERNIGHT');
    const existing = existingMap.get(alertId);
    const resolvedHistoricAlert = Array.from(existingMap.values()).find(
      (a) =>
        a.buildingId === buildingId &&
        a.status === 'Resolved' &&
        a.resolvedAt &&
        new Date(firstReading.timestamp).getTime() <= new Date(a.resolvedAt).getTime()
    );

    const alert: AnomalyAlert = {
      id: alertId,
      buildingId,
      buildingName,
      detectedAt: firstReading.timestamp,
      rule: 'CONTINUOUS_OVERNIGHT',
      ruleName: 'Continuous Overnight Flow',
      severity,
      actualLitres: avgActual,
      expectedLitres: avgExpected,
      estimatedExcessLitres: totalExcess,
      durationHours: duration,
      explanation: `Continuous non-zero flow detected during low-occupancy hours (${
        currentSettings.lowUsageStartHour
      }:00 - ${currentSettings.lowUsageEndHour}:00) for ${duration} consecutive hours. Average usage: ${avgActual} L/hr vs baseline ${avgExpected} L/hr (threshold: ${
        currentSettings.continuousFlowThresholdLitres
      } L/hr).`,
      evidenceStrength: duration >= 4 ? 'High' : 'Moderate',
      status: existing ? existing.status : resolvedHistoricAlert ? 'Resolved' : 'New',
      recommendedAction:
        'Audit toilet cisterns, urinals, underground line couplings, and external bib taps for continuous bypass.',
      supportingReadings: consecutiveReadings.map((r) => ({
        timestamp: r.timestamp,
        actualLitres: r.consumptionLitres,
        expectedLitres: r.expectedLitres,
      })),
      falsePositiveReason: existing?.falsePositiveReason,
      resolutionNotes: existing?.resolutionNotes || resolvedHistoricAlert?.resolutionNotes,
      acknowledgedAt: existing?.acknowledgedAt,
      resolvedAt: existing?.resolvedAt || resolvedHistoricAlert?.resolvedAt,
      inspectionId: existing?.inspectionId || resolvedHistoricAlert?.inspectionId,
    };

    alertMap.set(alertId, alert);
  }

  // Flatten annotated readings
  const annotatedReadings: MeterReading[] = [];
  for (const list of buildingReadingsMap.values()) {
    annotatedReadings.push(...list);
  }

  const alerts = Array.from(alertIdMap.values()).sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  const totalPotentialExcessLitres = alerts.reduce(
    (sum, a) => sum + a.estimatedExcessLitres,
    0
  );

  return {
    alerts,
    annotatedReadings,
    summary: {
      totalReadingsEvaluated: readings.length,
      anomaliesFound: alerts.length,
      spikesCount: totalSpikes,
      continuousFlowCount: totalContinuous,
      repeatedNightCount: totalRepeatedNight,
      totalPotentialExcessLitres,
    },
  };
}
