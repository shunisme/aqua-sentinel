import { MeterReading, RepairRecord, VerificationResult } from '../types';

/**
 * Repair Verification Engine.
 * Analyzes pre-repair vs post-repair readings to verify whether repairs successfully reduced consumption.
 */

export interface VerificationAnalysis {
  result: VerificationResult;
  preRepairReadings: MeterReading[];
  postRepairReadings: MeterReading[];
  comparisonChartData: Array<{
    period: string; // e.g., 'Pre-Repair Avg' | 'Post-Repair Avg' | or hourly timestamp
    hourlyConsumption: number;
    expectedBaseline: number;
    difference: number;
  }>;
  cumulativeSavedLitres: number;
  financialSavedRM: number;
}

export function verifyRepairOutcome(
  buildingId: string,
  repair: RepairRecord,
  allReadings: MeterReading[],
  waterTariffRMPerM3: number = 2.85
): VerificationAnalysis {
  const repairTime = new Date(repair.completedAt).getTime();

  // Filter building readings
  const buildingReadings = allReadings
    .filter((r) => r.buildingId === buildingId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Window: Pre-repair (up to 72 hours before repair)
  const windowMillis72h = 72 * 60 * 60 * 1000;
  const preReadings = buildingReadings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t < repairTime && t >= repairTime - windowMillis72h;
  });

  // Window: Post-repair (readings after repair completion)
  const postReadings = buildingReadings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= repairTime;
  });

  const postHours = postReadings.length;

  // Calculate pre-repair average hourly consumption
  const preAvg =
    preReadings.length > 0
      ? preReadings.reduce((sum, r) => sum + r.consumptionLitres, 0) / preReadings.length
      : 300;

  // Calculate post-repair average hourly consumption
  const postAvg =
    postReadings.length > 0
      ? postReadings.reduce((sum, r) => sum + r.consumptionLitres, 0) / postReadings.length
      : preAvg * 0.7; // fallback if no readings yet

  const hourlyReduction = Math.max(0, preAvg - postAvg);
  const dailySavedLitres = Math.round(hourlyReduction * 24);
  const reductionPercent = preAvg > 0 ? Math.round(((preAvg - postAvg) / preAvg) * 100) : 0;

  // Determine status:
  // - If observation < 24 hours: Preliminary
  // - If observation >= 48 hours and reduction > 10%: Verified
  // - If reduction <= 0%: Failed / Inconclusive
  let status: 'Pending' | 'Preliminary' | 'Verified' | 'Failed' = 'Pending';
  let notes = '';

  if (postHours === 0) {
    status = 'Pending';
    notes = 'Awaiting post-repair meter telemetry to commence verification.';
  } else if (postHours < 24) {
    status = 'Preliminary';
    notes = `Preliminary observation (${postHours} hours post-repair). Observed reduction of ${reductionPercent}%. Full 48-hour continuous verification recommended.`;
  } else if (reductionPercent > 10) {
    status = postHours >= 48 ? 'Verified' : 'Preliminary';
    notes = `Sustained post-repair reduction of ${reductionPercent}% observed over ${postHours} hours. Telemetry indicates successful flow restoration to baseline.`;
  } else {
    status = 'Failed';
    notes = `Post-repair consumption has not demonstrated significant reduction (-${Math.abs(
      reductionPercent
    )}%). Further on-site inspection recommended.`;
  }

  // Calculate cumulative savings
  const cumulativeHours = Math.max(postHours, 24);
  const cumulativeSavedLitres = Math.round(hourlyReduction * cumulativeHours);
  const financialSavedRM = Number(((cumulativeSavedLitres / 1000) * waterTariffRMPerM3).toFixed(2));

  const result: VerificationResult = {
    status,
    preRepairAverageHourlyLitres: Math.round(preAvg),
    postRepairAverageHourlyLitres: Math.round(postAvg),
    reductionLitresPerHour: Math.round(hourlyReduction),
    dailySavedLitres,
    reductionPercent: Math.max(0, reductionPercent),
    observationHours: postHours,
    verifiedAt: status === 'Verified' ? new Date().toISOString() : undefined,
    notes,
  };

  // Create chart comparison dataset
  const comparisonChartData = [
    {
      period: 'Pre-Repair Average',
      hourlyConsumption: Math.round(preAvg),
      expectedBaseline: Math.round(
        preReadings.length > 0
          ? preReadings.reduce((sum, r) => sum + r.expectedLitres, 0) / preReadings.length
          : preAvg * 0.6
      ),
      difference: Math.round(
        preAvg -
          (preReadings.length > 0
            ? preReadings.reduce((sum, r) => sum + r.expectedLitres, 0) / preReadings.length
            : preAvg * 0.6)
      ),
    },
    {
      period: 'Post-Repair Average',
      hourlyConsumption: Math.round(postAvg),
      expectedBaseline: Math.round(
        postReadings.length > 0
          ? postReadings.reduce((sum, r) => sum + r.expectedLitres, 0) / postReadings.length
          : preAvg * 0.6
      ),
      difference: Math.round(
        postAvg -
          (postReadings.length > 0
            ? postReadings.reduce((sum, r) => sum + r.expectedLitres, 0) / postReadings.length
            : preAvg * 0.6)
      ),
    },
  ];

  return {
    result,
    preRepairReadings: preReadings,
    postRepairReadings: postReadings,
    comparisonChartData,
    cumulativeSavedLitres,
    financialSavedRM,
  };
}
