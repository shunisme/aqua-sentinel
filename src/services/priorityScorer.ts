import {
  Building,
  AnomalyAlert,
  AppSettings,
  AlertSeverity,
  ScoreBreakdown,
} from '../types';

/**
 * Smart Inspection Priority Scoring Engine.
 * Normalises input metrics and produces a transparent 0-100 score with full mathematical breakdown.
 */

export interface PriorityScoreResult {
  score: number; // 0-100
  tier: AlertSeverity;
  breakdown: ScoreBreakdown;
  urgencyReason: string;
  recommendedAction: string;
}

/**
 * Normalises raw metrics to 0-100 scale:
 * 1. Potential Excess Score (0-100):
 *    Benchmark is 10,000 Litres/day (or equivalent). Scaled linearly up to 10,000 L/day.
 * 2. Persistence Score (0-100):
 *    Number of abnormal hours and repeat occurrences. Maxes at 24 hours.
 * 3. Severity Score (0-100):
 *    Critical = 100, High = 75, Medium = 50, Low = 25.
 * 4. Evidence Strength (0-100):
 *    High = 100, Moderate = 65, Preliminary = 35.
 */
export function calculateBuildingPriorityScore(
  building: Building,
  activeAlerts: AnomalyAlert[],
  settings: AppSettings
): PriorityScoreResult {
  const bAlerts = activeAlerts.filter(
    (a) => a.buildingId === building.id && a.status !== 'Resolved' && a.status !== 'False Positive'
  );

  // If building has no active alerts and is normal
  if (bAlerts.length === 0) {
    const defaultScore = 15;
    return {
      score: defaultScore,
      tier: 'Low',
      breakdown: {
        excessScore: 10,
        persistenceScore: 10,
        severityScore: 15,
        evidenceScore: 20,
        excessWeight: settings.priorityWeights.potentialExcess / 100,
        persistenceWeight: settings.priorityWeights.persistence / 100,
        severityWeight: settings.priorityWeights.severity / 100,
        evidenceWeight: settings.priorityWeights.evidenceStrength / 100,
        totalScore: defaultScore,
        explanation: 'Baseline routine inspection score. No active anomaly alerts recorded.',
      },
      urgencyReason: 'Stable baseline consumption. Regular scheduled preventive inspection.',
      recommendedAction: 'Maintain standard quarterly audit schedule.',
    };
  }

  // 1. Calculate Estimated Daily Potential Excess
  const totalExcessVolume = bAlerts.reduce((sum, a) => sum + a.estimatedExcessLitres, 0);
  // Estimate daily equivalent
  const dailyExcessLitres = Math.max(
    totalExcessVolume,
    (building.currentDailyLitres - building.expectedDailyLitres)
  );
  // Normalize against 8,000 L/day benchmark (cap at 100)
  const excessScore = Math.min(100, Math.max(0, (dailyExcessLitres / 8000) * 100));

  // 2. Calculate Persistence Score (0-100)
  // Sum duration of alerts and frequency of occurrences
  const totalDurationHours = bAlerts.reduce((sum, a) => sum + a.durationHours, 0);
  const alertCountFactor = (bAlerts.length - 1) * 20;
  const persistenceScore = Math.min(100, Math.max(10, (totalDurationHours / 16) * 70 + alertCountFactor));

  // 3. Calculate Severity Score (0-100)
  const severityPoints: Record<AlertSeverity, number> = {
    Critical: 100,
    High: 75,
    Medium: 50,
    Low: 25,
  };
  // Take highest severity among active alerts
  const highestSeverity = bAlerts.reduce((highest, a) => {
    return severityPoints[a.severity] > severityPoints[highest] ? a.severity : highest;
  }, 'Low' as AlertSeverity);
  const severityScore = severityPoints[highestSeverity];

  // 4. Calculate Evidence Strength Score (0-100)
  const evidencePoints: Record<string, number> = {
    High: 100,
    Moderate: 65,
    Preliminary: 35,
  };
  const highestEvidence = bAlerts.reduce((highest, a) => {
    return (evidencePoints[a.evidenceStrength] || 35) > (evidencePoints[highest] || 35)
      ? a.evidenceStrength
      : highest;
  }, 'Preliminary');
  const evidenceScore = evidencePoints[highestEvidence] || 50;

  // Weights normalized to sum to 1.0
  const rawSumWeights =
    settings.priorityWeights.potentialExcess +
    settings.priorityWeights.persistence +
    settings.priorityWeights.severity +
    settings.priorityWeights.evidenceStrength;

  const wExcess = settings.priorityWeights.potentialExcess / (rawSumWeights || 100);
  const wPersistence = settings.priorityWeights.persistence / (rawSumWeights || 100);
  const wSeverity = settings.priorityWeights.severity / (rawSumWeights || 100);
  const wEvidence = settings.priorityWeights.evidenceStrength / (rawSumWeights || 100);

  const weightedSum =
    excessScore * wExcess +
    persistenceScore * wPersistence +
    severityScore * wSeverity +
    evidenceScore * wEvidence;

  const finalScore = Math.min(100, Math.max(1, Math.round(weightedSum)));

  // Determine Tier
  let tier: AlertSeverity = 'Low';
  if (finalScore >= settings.priorityThresholds.critical) {
    tier = 'Critical';
  } else if (finalScore >= settings.priorityThresholds.high) {
    tier = 'High';
  } else if (finalScore >= settings.priorityThresholds.medium) {
    tier = 'Medium';
  }

  // Generate explanation
  const explanation = `Score ${finalScore}/100: Excess (${Math.round(excessScore)} × ${Math.round(
    wExcess * 100
  )}%) + Persistence (${Math.round(persistenceScore)} × ${Math.round(
    wPersistence * 100
  )}%) + Severity [${highestSeverity}] (${Math.round(severityScore)} × ${Math.round(
    wSeverity * 100
  )}%) + Evidence [${highestEvidence}] (${Math.round(evidenceScore)} × ${Math.round(
    wEvidence * 100
  )}%).`;

  // Determine Urgency Reason and Recommended Action
  let urgencyReason = `Elevated consumption pattern flagged across ${bAlerts.length} active alert(s).`;
  if (highestSeverity === 'Critical') {
    urgencyReason = `Critical spike or massive volume loss flagged (est. ${Math.round(
      dailyExcessLitres
    ).toLocaleString()} L/day excess). Immediate investigation warranted.`;
  } else if (bAlerts.some((a) => a.rule === 'CONTINUOUS_OVERNIGHT')) {
    urgencyReason = `Sustained continuous flow observed during 01:00-05:00 window, indicating potential pipe breach or open fixture.`;
  } else if (bAlerts.some((a) => a.rule === 'REPEATED_NIGHTTIME')) {
    urgencyReason = `Repeated nocturnal deviations across multiple consecutive nights indicating non-random water loss.`;
  }

  let recommendedAction = 'Schedule on-site visual acoustic and meter inspection.';
  if (tier === 'Critical') {
    recommendedAction = 'Dispatch maintenance crew immediately; inspect main supply isolation valve.';
  } else if (tier === 'High') {
    recommendedAction = 'Assign high-priority technician audit within 24 hours. Check toilet cisterns and cooling towers.';
  } else if (tier === 'Medium') {
    recommendedAction = 'Queue for technician review within 48-72 hours.';
  }

  return {
    score: finalScore,
    tier,
    breakdown: {
      excessScore: Math.round(excessScore),
      persistenceScore: Math.round(persistenceScore),
      severityScore: Math.round(severityScore),
      evidenceScore: Math.round(evidenceScore),
      excessWeight: wExcess,
      persistenceWeight: wPersistence,
      severityWeight: wSeverity,
      evidenceWeight: wEvidence,
      totalScore: finalScore,
      explanation,
    },
    urgencyReason,
    recommendedAction,
  };
}
