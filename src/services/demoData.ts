import {
  Building,
  MeterReading,
  AppSettings,
  Inspection,
  AnomalyAlert,
} from '../types';
import { runAnomalyDetection } from './anomalyDetection';
import { calculateBuildingPriorityScore } from './priorityScorer';

export const DEFAULT_SETTINGS: AppSettings = {
  orgName: 'Universiti Malaya Campus Operations',
  waterTariffRMPerM3: 2.20,
  unitPreference: 'litres',
  lowUsageStartHour: 1, // 01:00
  lowUsageEndHour: 5,   // 05:00
  spikeThresholdPercent: 200,
  minSpikeExcessLitres: 150,
  continuousFlowMinHours: 3,
  continuousFlowThresholdLitres: 80,
  repeatedNightThresholdPercent: 150,
  priorityWeights: {
    potentialExcess: 35,
    persistence: 25,
    severity: 20,
    evidenceStrength: 20,
  },
  priorityThresholds: {
    critical: 80,
    high: 60,
    medium: 35,
  },
};

/**
 * Curated 5 Core University Buildings (User requested: around 4-5 buildings)
 */
export const RAW_BUILDINGS_META: Array<Omit<Building, 'currentDailyLitres' | 'openAlertsCount' | 'priorityScore' | 'latestReadingTimestamp'>> = [
  {
    id: 'BLD-101',
    name: 'Dewan Kuliah Tunku Canselor (Grand Complex)',
    category: 'Lecture Hall',
    zone: 'North Campus',
    floors: 4,
    meterId: 'MTR-101-UM',
    baselineDailyLitres: 4800,
    expectedDailyLitres: 4800,
    anomalyStatus: 'Normal',
    inspectionStatus: 'None',
    description: 'Premier ceremonial and multi-theatre lecture venue with central washrooms.',
    yearBuilt: 1965,
  },
  {
    id: 'BLD-102',
    name: 'Kolej Kediaman 5 (Block C)',
    category: 'Residential',
    zone: 'Residential Quarter',
    floors: 8,
    meterId: 'MTR-102-KK5',
    baselineDailyLitres: 9500,
    expectedDailyLitres: 9500,
    anomalyStatus: 'Suspected Leak',
    inspectionStatus: 'Open',
    description: 'Student residence accommodating 450 residents.',
    yearBuilt: 1988,
  },
  {
    id: 'BLD-103',
    name: 'Faculty of Engineering (Block E Labs)',
    category: 'Laboratory',
    zone: 'Science Park',
    floors: 6,
    meterId: 'MTR-103-ENG',
    baselineDailyLitres: 6200,
    expectedDailyLitres: 6200,
    anomalyStatus: 'Normal',
    inspectionStatus: 'Verified',
    description: 'Civil and mechanical engineering research laboratories with heavy testing rigs.',
    yearBuilt: 1994,
  },
  {
    id: 'BLD-106',
    name: 'Biotech Research Annex & Cleanroom',
    category: 'Laboratory',
    zone: 'Science Park',
    floors: 4,
    meterId: 'MTR-106-BIO',
    baselineDailyLitres: 7800,
    expectedDailyLitres: 7800,
    anomalyStatus: 'High Flow',
    inspectionStatus: 'Assigned',
    description: 'Molecular genomics laboratory with dedicated reverse-osmosis purifiers.',
    yearBuilt: 2012,
  },
  {
    id: 'BLD-109',
    name: 'Aquatic Sports Complex & Olympic Pool',
    category: 'Sports Complex',
    zone: 'Sports Hub',
    floors: 2,
    meterId: 'MTR-109-SPT',
    baselineDailyLitres: 14500,
    expectedDailyLitres: 14500,
    anomalyStatus: 'Suspected Leak',
    inspectionStatus: 'Open',
    description: '50-meter Olympic competition pool, diving pool, and athlete showers.',
    yearBuilt: 1998,
  },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDiurnalMultiplier(category: string, hour: number): number {
  switch (category) {
    case 'Residential':
    case 'Hostel':
      if (hour >= 1 && hour <= 5) return 0.08;
      if (hour >= 6 && hour <= 9) return 1.8;
      if (hour >= 10 && hour <= 17) return 0.7;
      if (hour >= 18 && hour <= 23) return 1.6;
      return 0.2;
    case 'Laboratory':
      if (hour >= 1 && hour <= 6) return 0.2;
      if (hour >= 9 && hour <= 17) return 1.6;
      return 0.5;
    case 'Sports Complex':
      if (hour >= 0 && hour <= 6) return 0.05;
      if (hour >= 7 && hour <= 15) return 0.9;
      if (hour >= 16 && hour <= 21) return 2.1;
      return 0.3;
    default:
      if (hour >= 0 && hour <= 7) return 0.05;
      if (hour >= 8 && hour <= 17) return 1.7;
      if (hour >= 18 && hour <= 22) return 0.4;
      return 0.1;
  }
}

/**
 * Generates realistic hourly readings for the 5 buildings.
 */
export function generateDemoDataset(): {
  buildings: Building[];
  readings: MeterReading[];
  initialAlerts: AnomalyAlert[];
  initialInspections: Inspection[];
} {
  const readings: MeterReading[] = [];
  const DAYS = 14;
  const HOURS_PER_DAY = 24;

  const currentTimestamp = new Date('2026-10-12T22:00:00+08:00').getTime();
  const startTime = currentTimestamp - (DAYS * 24 * 3600 * 1000);

  let readingSeq = 1;

  for (const bMeta of RAW_BUILDINGS_META) {
    const hourlyBase = bMeta.baselineDailyLitres / 24;

    for (let day = 0; day < DAYS; day++) {
      for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
        const pointTime = new Date(startTime + (day * 24 + hour) * 3600 * 1000);
        const isoString = pointTime.toISOString();
        const seed = bMeta.id.charCodeAt(5) * 1000 + day * 100 + hour;

        const multiplier = getDiurnalMultiplier(bMeta.category, hour);
        const noise = (seededRandom(seed) - 0.5) * 0.12;
        const expectedLitres = Math.round(hourlyBase * multiplier * (1 + noise));

        let actualLitres = expectedLitres;

        // SCENARIO A: Persistent overnight flow in BLD-102 (Hostel Block C)
        if (bMeta.id === 'BLD-102') {
          if (day >= 9) {
            if (hour >= 1 && hour <= 5) {
              actualLitres = Math.round(155 + (seededRandom(seed + 1) * 35));
            } else {
              actualLitres = Math.round(expectedLitres * 1.12);
            }
          }
        }

        // SCENARIO B: Sudden spike in BLD-106 (Biotech Research Annex)
        if (bMeta.id === 'BLD-106') {
          if (day === 13 && hour >= 14 && hour <= 16) {
            actualLitres = Math.round(1250 + (seededRandom(seed + 2) * 180));
          }
        }

        // SCENARIO C: Repeated nighttime anomaly in BLD-109 (Sports Complex & Olympic Pool)
        if (bMeta.id === 'BLD-109') {
          if (day >= 11 && hour >= 2 && hour <= 4) {
            actualLitres = Math.round(230 + (seededRandom(seed + 3) * 60));
          }
        }

        // SCENARIO E: Repair success in BLD-103 (Faculty of Engineering Block E)
        if (bMeta.id === 'BLD-103') {
          if (day < 10 || (day === 10 && hour < 10)) {
            actualLitres = Math.round(expectedLitres + 320 + (seededRandom(seed + 4) * 50));
          } else {
            actualLitres = Math.round(expectedLitres * (1 + (seededRandom(seed + 5) - 0.5) * 0.08));
          }
        }

        // BLD-101: Minor flushometer seepage on Day 8
        if (bMeta.id === 'BLD-101') {
          if (day === 8 && hour >= 13 && hour <= 15) {
            actualLitres = Math.round(expectedLitres + 260);
          }
        }

        readings.push({
          id: `RDG-${readingSeq++}`,
          buildingId: bMeta.id,
          meterId: bMeta.meterId,
          timestamp: isoString,
          consumptionLitres: Math.max(5, actualLitres),
          expectedLitres: Math.max(5, expectedLitres),
        });
      }
    }
  }

  // Exactly 6 Leak Alerts (User requested: around 5-7 leak alerts)
  const initialAlerts: AnomalyAlert[] = [
    {
      id: 'ALT-20261012-COF-BLD102',
      buildingId: 'BLD-102',
      buildingName: 'Kolej Kediaman 5 (Block C)',
      detectedAt: '2026-10-12T05:00:00+08:00',
      rule: 'CONTINUOUS_OVERNIGHT',
      ruleName: 'Continuous Overnight Baseline Flow',
      severity: 'Critical',
      actualLitres: 185,
      expectedLitres: 15,
      estimatedExcessLitres: 3200,
      durationHours: 4,
      explanation: 'Continuous nocturnal flow of 165-185 L/hr detected between 01:00-05:00 for 4 consecutive nights.',
      evidenceStrength: 'High',
      status: 'Acknowledged',
      recommendedAction: 'Isolate block supply risers floor by floor using acoustic leak detector to locate rupture.',
      acknowledgedAt: '2026-10-12T08:00:00+08:00',
      supportingReadings: [
        { timestamp: '2026-10-12T01:00:00+08:00', actualLitres: 172, expectedLitres: 14 },
        { timestamp: '2026-10-12T02:00:00+08:00', actualLitres: 180, expectedLitres: 12 },
        { timestamp: '2026-10-12T03:00:00+08:00', actualLitres: 185, expectedLitres: 11 },
        { timestamp: '2026-10-12T04:00:00+08:00', actualLitres: 178, expectedLitres: 13 },
      ],
    },
    {
      id: 'ALT-20261012-SPK-BLD106',
      buildingId: 'BLD-106',
      buildingName: 'Biotech Research Annex & Cleanroom',
      detectedAt: '2026-10-12T16:00:00+08:00',
      rule: 'SPIKE',
      ruleName: 'Unexpected Consumption Spike',
      severity: 'Critical',
      actualLitres: 1320,
      expectedLitres: 260,
      estimatedExcessLitres: 4800,
      durationHours: 3,
      explanation: 'Extreme flow spike exceeding 1,250 L/hr (+400% baseline) during operational cleanroom hours.',
      evidenceStrength: 'High',
      status: 'Under Investigation',
      recommendedAction: 'Inspect rooftop cooling tower make-up float valve and RO water treatment drainage trap.',
      acknowledgedAt: '2026-10-12T16:15:00+08:00',
      supportingReadings: [
        { timestamp: '2026-10-12T14:00:00+08:00', actualLitres: 1280, expectedLitres: 250 },
        { timestamp: '2026-10-12T15:00:00+08:00', actualLitres: 1320, expectedLitres: 260 },
        { timestamp: '2026-10-12T16:00:00+08:00', actualLitres: 1290, expectedLitres: 245 },
      ],
    },
    {
      id: 'ALT-20261012-RNU-BLD109',
      buildingId: 'BLD-109',
      buildingName: 'Aquatic Sports Complex & Olympic Pool',
      detectedAt: '2026-10-12T04:00:00+08:00',
      rule: 'REPEATED_NIGHTTIME',
      ruleName: 'Repeated Unusual Nighttime Usage',
      severity: 'High',
      actualLitres: 250,
      expectedLitres: 35,
      estimatedExcessLitres: 1800,
      durationHours: 3,
      explanation: 'Repeated nocturnal volume flagged between 02:00-04:00 across 3 consecutive nights.',
      evidenceStrength: 'High',
      status: 'New',
      recommendedAction: 'Inspect pool filtration backwash bypass valve and surge tank automated makeup sensor.',
      supportingReadings: [
        { timestamp: '2026-10-12T02:00:00+08:00', actualLitres: 240, expectedLitres: 30 },
        { timestamp: '2026-10-12T03:00:00+08:00', actualLitres: 255, expectedLitres: 28 },
        { timestamp: '2026-10-12T04:00:00+08:00', actualLitres: 245, expectedLitres: 32 },
      ],
    },
    {
      id: 'ALT-20261011-COF-BLD102',
      buildingId: 'BLD-102',
      buildingName: 'Kolej Kediaman 5 (Block C)',
      detectedAt: '2026-10-11T05:00:00+08:00',
      rule: 'CONTINUOUS_OVERNIGHT',
      ruleName: 'Continuous Overnight Baseline Flow',
      severity: 'High',
      actualLitres: 165,
      expectedLitres: 14,
      estimatedExcessLitres: 1450,
      durationHours: 4,
      explanation: 'Continuous nocturnal seepage observed on secondary wing riser line.',
      evidenceStrength: 'Moderate',
      status: 'Under Investigation',
      recommendedAction: 'Verify floor-by-floor isolation valves on eastern residential wing.',
      acknowledgedAt: '2026-10-11T08:30:00+08:00',
    },
    {
      id: 'ALT-20261010-COF-BLD103',
      buildingId: 'BLD-103',
      buildingName: 'Faculty of Engineering (Block E Labs)',
      detectedAt: '2026-10-09T08:00:00+08:00',
      rule: 'CONTINUOUS_OVERNIGHT',
      ruleName: 'Continuous Baseline Deviation',
      severity: 'Critical',
      actualLitres: 445,
      expectedLitres: 135,
      estimatedExcessLitres: 7440,
      durationHours: 9,
      explanation: 'Elevated daytime and overnight consumption caused by 8 leaking washroom cisterns.',
      evidenceStrength: 'High',
      status: 'Resolved',
      recommendedAction: 'Replaced 8 cistern flappers and calibrated float arm. Baseline restored.',
      acknowledgedAt: '2026-10-09T09:15:00+08:00',
      resolvedAt: '2026-10-10T14:30:00+08:00',
      resolutionNotes: 'Repaired 8 faulty toilet cistern flapper valves on Level 3 washrooms. Flow successfully restored.',
    },
    {
      id: 'ALT-20261008-SPK-BLD101',
      buildingId: 'BLD-101',
      buildingName: 'Dewan Kuliah Tunku Canselor (Grand Complex)',
      detectedAt: '2026-10-08T15:00:00+08:00',
      rule: 'SPIKE',
      ruleName: 'Unexpected Consumption Spike',
      severity: 'Medium',
      actualLitres: 480,
      expectedLitres: 210,
      estimatedExcessLitres: 850,
      durationHours: 2,
      explanation: 'Temporary surge in washroom inflow following large academic assembly.',
      evidenceStrength: 'Moderate',
      status: 'New',
      recommendedAction: 'Check ground floor public washroom urinal solenoid sensors.',
    },
  ];

  // Calculate current daily consumption and priority scores for the 5 buildings
  const buildings: Building[] = RAW_BUILDINGS_META.map((bMeta) => {
    const last24Readings = readings
      .filter((r) => r.buildingId === bMeta.id)
      .slice(-24);
    const currentDailyLitres = last24Readings.reduce((sum, r) => sum + r.consumptionLitres, 0);

    const bAlerts = initialAlerts.filter(
      (a) => a.buildingId === bMeta.id && a.status !== 'Resolved' && a.status !== 'False Positive'
    );

    const baseBuilding: Building = {
      ...bMeta,
      currentDailyLitres,
      openAlertsCount: bAlerts.length,
      latestReadingTimestamp: '2026-10-12T22:00:00+08:00',
      priorityScore: 0,
    };

    const scoreResult = calculateBuildingPriorityScore(baseBuilding, initialAlerts, DEFAULT_SETTINGS);
    baseBuilding.priorityScore = scoreResult.score;

    return baseBuilding;
  });

  // Exactly 3 Active Queue Inspections + Exactly 3 Verified Maintenance History
  // (User requested: inspection queue 2-3, maintenance history 3)
  const initialInspections: Inspection[] = [
    // --- ACTIVE INSPECTION QUEUE (3 ITEMS) ---
    {
      id: 'INS-2026-001',
      alertId: 'ALT-20261012-COF-BLD102',
      buildingId: 'BLD-102',
      buildingName: 'Kolej Kediaman 5 (Block C)',
      priorityScore: 88,
      priorityTier: 'Critical',
      status: 'Open',
      assignedInspector: 'Ahmad Faiz (Senior Plumber)',
      createdAt: '2026-10-11T09:00:00+08:00',
      dueDate: '2026-10-13T17:00:00+08:00',
      urgencyReason: 'Persistent overnight baseline flow of 150-180 L/hr detected between 01:00-05:00 for 4 consecutive nights.',
      recommendedAction: 'Isolate block supply risers floor by floor using acoustic leak detector to locate underground pipe rupture.',
      estimatedExcessLitresDay: 3200,
      timeSinceAnomaly: '3 days ago',
      scoreBreakdown: {
        excessScore: 78,
        persistenceScore: 92,
        severityScore: 100,
        evidenceScore: 95,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 88,
        explanation: 'Critical overnight loss with sustained 4-day persistence and strong telemetry evidence.',
      },
      timeline: [
        {
          id: 'TL-1',
          timestamp: '2026-10-11T09:00:00+08:00',
          actor: 'Detection Engine',
          action: 'Inspection ticket automatically generated from Continuous Overnight Flow alert.',
        },
        {
          id: 'TL-2',
          timestamp: '2026-10-11T10:15:00+08:00',
          actor: 'Operations Dispatcher',
          action: 'Assigned to Ahmad Faiz (Senior Plumber) with due date 13 Oct 2026.',
        },
      ],
    },
    {
      id: 'INS-2026-002',
      alertId: 'ALT-20261012-SPK-BLD106',
      buildingId: 'BLD-106',
      buildingName: 'Biotech Research Annex & Cleanroom',
      priorityScore: 84,
      priorityTier: 'Critical',
      status: 'Inspecting',
      assignedInspector: 'Tan Wei Ming (HVAC Specialist)',
      createdAt: '2026-10-12T14:45:00+08:00',
      dueDate: '2026-10-13T12:00:00+08:00',
      urgencyReason: 'Extreme consumption spike exceeding 1,250 L/hr (+400% baseline).',
      recommendedAction: 'Inspect rooftop cooling tower make-up float valve and RO water treatment drainage trap.',
      estimatedExcessLitresDay: 4800,
      timeSinceAnomaly: '6 hours ago',
      scoreBreakdown: {
        excessScore: 90,
        persistenceScore: 50,
        severityScore: 100,
        evidenceScore: 95,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 84,
        explanation: 'Very high volume rate spike triggering emergency critical threshold.',
      },
      findings: {
        causeSuspected: 'Rooftop cooling tower make-up float valve stuck in open position, continuously discharging to overflow drain.',
        leakConfirmed: 'Yes',
        notes: 'Technician on site confirmed continuous overflow discharging directly into storm drain. Isolation valve shut off temporarily.',
        inspectedAt: '2026-10-12T16:00:00+08:00',
        inspector: 'Tan Wei Ming',
      },
      timeline: [
        {
          id: 'TL-3',
          timestamp: '2026-10-12T14:45:00+08:00',
          actor: 'Detection Engine',
          action: 'Critical Spike alert flagged; inspection generated.',
        },
        {
          id: 'TL-4',
          timestamp: '2026-10-12T16:00:00+08:00',
          actor: 'Tan Wei Ming',
          action: 'Status changed to Inspecting. Cooling tower overflow confirmed.',
        },
      ],
    },
    {
      id: 'INS-2026-003',
      alertId: 'ALT-20261012-RNU-BLD109',
      buildingId: 'BLD-109',
      buildingName: 'Aquatic Sports Complex & Olympic Pool',
      priorityScore: 72,
      priorityTier: 'High',
      status: 'Assigned',
      assignedInspector: 'Ahmad Faiz (Senior Plumber)',
      createdAt: '2026-10-12T08:30:00+08:00',
      dueDate: '2026-10-14T17:00:00+08:00',
      urgencyReason: 'Repeated nighttime anomalies flagged between 02:00-04:00 across 3 consecutive nights.',
      recommendedAction: 'Inspect pool filtration backwash bypass valve and surge tank automated makeup sensor.',
      estimatedExcessLitresDay: 1800,
      timeSinceAnomaly: '1 day ago',
      scoreBreakdown: {
        excessScore: 65,
        persistenceScore: 80,
        severityScore: 75,
        evidenceScore: 70,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 72,
        explanation: 'Elevated nocturnal volume with recurring pattern across 3 nights.',
      },
      timeline: [
        {
          id: 'TL-5',
          timestamp: '2026-10-12T08:30:00+08:00',
          actor: 'Detection Engine',
          action: 'Ticket created following 3rd consecutive night anomaly.',
        },
      ],
    },

    // --- VERIFIED MAINTENANCE HISTORY (3 ITEMS) ---
    {
      id: 'INS-2026-004',
      buildingId: 'BLD-103',
      buildingName: 'Faculty of Engineering (Block E Labs)',
      priorityScore: 20,
      priorityTier: 'Low',
      status: 'Verified',
      assignedInspector: 'K. Rajan (Plumbing Specialist)',
      createdAt: '2026-10-09T08:30:00+08:00',
      dueDate: '2026-10-10T12:00:00+08:00',
      urgencyReason: 'Elevated baseline water consumption (+350 L/hr) across daytime and overnight.',
      recommendedAction: 'Inspect male and female washroom blocks on floors 2, 3 and 4.',
      estimatedExcessLitresDay: 7440,
      timeSinceAnomaly: '4 days ago (Resolved)',
      scoreBreakdown: {
        excessScore: 82,
        persistenceScore: 88,
        severityScore: 80,
        evidenceScore: 90,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 85,
        explanation: 'Initial score was 85/100 (Critical). Dropped to 20/100 following verified repair.',
      },
      findings: {
        causeSuspected: '8 faulty toilet cistern flapper valves in 3rd floor washrooms failing to seal after flushing.',
        leakConfirmed: 'Yes',
        notes: 'Water continuously trickled through overflow tube into toilet bowls.',
        inspectedAt: '2026-10-09T14:00:00+08:00',
        inspector: 'K. Rajan',
      },
      repair: {
        repairDescription: 'Replaced 8 silicone flapper valves and adjusted ball float water level on all Level 3 cisterns.',
        completedAt: '2026-10-10T10:00:00+08:00',
        technician: 'K. Rajan & Team',
        costRM: 380,
        partsReplaced: '8x Fluidmaster 2-inch Ultra Flappers, 2x Brass Ballcock Float Rods',
      },
      verification: {
        status: 'Verified',
        preRepairAverageHourlyLitres: 445,
        postRepairAverageHourlyLitres: 135,
        reductionLitresPerHour: 310,
        dailySavedLitres: 7440,
        reductionPercent: 70,
        observationHours: 58,
        verifiedAt: '2026-10-12T20:00:00+08:00',
        notes: 'Continuous post-repair telemetry over 58 hours confirms consumption dropped by 70% (310 L/hr saved), returning precisely to historical baseline.',
      },
      timeline: [
        {
          id: 'TL-6',
          timestamp: '2026-10-09T08:30:00+08:00',
          actor: 'System',
          action: 'Ticket created from continuous baseline deviation alert.',
        },
        {
          id: 'TL-7',
          timestamp: '2026-10-09T14:30:00+08:00',
          actor: 'K. Rajan',
          action: 'Inspection completed: Confirmed 8 leaking toilet cisterns.',
        },
        {
          id: 'TL-8',
          timestamp: '2026-10-10T10:00:00+08:00',
          actor: 'K. Rajan',
          action: 'Repair completed. Status changed to Verification Pending.',
        },
        {
          id: 'TL-9',
          timestamp: '2026-10-12T20:00:00+08:00',
          actor: 'Verification Engine',
          action: '58 hours telemetry analyzed. 70% reduction confirmed. Status updated to Verified!',
        },
      ],
    },
    {
      id: 'INS-2026-006',
      buildingId: 'BLD-102',
      buildingName: 'Kolej Kediaman 5 (Block C)',
      priorityScore: 16,
      priorityTier: 'Low',
      status: 'Verified',
      assignedInspector: 'Ahmad Faiz (Senior Plumber)',
      createdAt: '2026-10-04T08:00:00+08:00',
      dueDate: '2026-10-05T17:00:00+08:00',
      urgencyReason: 'Underground weeping joint behind Ground Floor laundry room causing sustained 160 L/hr nocturnal loss.',
      recommendedAction: 'Pressure test laundry room line and replace corroded isolation stopcock.',
      estimatedExcessLitresDay: 3840,
      timeSinceAnomaly: 'Verified 8 days ago',
      scoreBreakdown: {
        excessScore: 72,
        persistenceScore: 85,
        severityScore: 75,
        evidenceScore: 90,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 79,
        explanation: 'Initial score was 79/100 (Critical). Dropped to 16/100 after verified repair.',
      },
      findings: {
        causeSuspected: 'Fractured PVC fitting and weeping copper stopcock behind washing machine bank in ground floor laundry room.',
        leakConfirmed: 'Yes',
        notes: 'Water continuously seeped into subfloor conduit. Identified using acoustic listening stick.',
        inspectedAt: '2026-10-04T10:30:00+08:00',
        inspector: 'Ahmad Faiz',
      },
      repair: {
        repairDescription: 'Replaced fractured 25mm PVC coupler, installed heavy-duty brass quarter-turn ball valve, resealed wall penetration.',
        completedAt: '2026-10-05T14:00:00+08:00',
        technician: 'Ahmad Faiz & Zamri',
        costRM: 260,
        partsReplaced: '25mm Class 7 PVC union, Pegler brass ball valve, PTFE seal tape',
      },
      verification: {
        status: 'Verified',
        preRepairAverageHourlyLitres: 245,
        postRepairAverageHourlyLitres: 85,
        reductionLitresPerHour: 160,
        dailySavedLitres: 3840,
        reductionPercent: 65,
        observationHours: 96,
        verifiedAt: '2026-10-08T18:00:00+08:00',
        notes: 'Smart meter confirms 3,840 L/day reduction. Steady night baseline restored at 85 L/hr over 96 hours of continuous telemetry.',
      },
      timeline: [
        {
          id: 'TL-12',
          timestamp: '2026-10-04T08:00:00+08:00',
          actor: 'Detection Engine',
          action: 'Overnight flow anomaly detected in Laundry Room sub-meter.',
        },
        {
          id: 'TL-13',
          timestamp: '2026-10-04T10:30:00+08:00',
          actor: 'Ahmad Faiz',
          action: 'Inspection completed: Confirmed fractured laundry pipe joint.',
        },
        {
          id: 'TL-14',
          timestamp: '2026-10-05T14:00:00+08:00',
          actor: 'Ahmad Faiz & Zamri',
          action: 'Repaired pipe fitting & replaced shutoff ball valve.',
        },
        {
          id: 'TL-15',
          timestamp: '2026-10-08T18:00:00+08:00',
          actor: 'Verification Engine',
          action: '96 hours telemetry evaluated: 65% reduction (3,840 L/day saved). Status Verified!',
        },
      ],
    },
    {
      id: 'INS-2026-007',
      buildingId: 'BLD-101',
      buildingName: 'Dewan Kuliah Tunku Canselor (Grand Complex)',
      priorityScore: 18,
      priorityTier: 'Low',
      status: 'Verified',
      assignedInspector: 'Zamri Plumber',
      createdAt: '2026-10-03T09:00:00+08:00',
      dueDate: '2026-10-04T17:00:00+08:00',
      urgencyReason: 'Continuous dripping from shower mixer valves in ground floor washroom block.',
      recommendedAction: 'Inspect and replace worn ceramic disc mixer cartridges.',
      estimatedExcessLitresDay: 2880,
      timeSinceAnomaly: 'Verified 9 days ago',
      scoreBreakdown: {
        excessScore: 65,
        persistenceScore: 80,
        severityScore: 70,
        evidenceScore: 85,
        excessWeight: 0.35,
        persistenceWeight: 0.25,
        severityWeight: 0.2,
        evidenceWeight: 0.2,
        totalScore: 73,
        explanation: 'Initial score 73/100. Dropped to 18/100 post-repair.',
      },
      findings: {
        causeSuspected: '4 worn ceramic disc mixer cartridges failing to close completely in ground floor washroom sinks.',
        leakConfirmed: 'Yes',
        notes: 'Constant flow into sink drains totalling 120 L/hr.',
        inspectedAt: '2026-10-03T11:00:00+08:00',
        inspector: 'Zamri Plumber',
      },
      repair: {
        repairDescription: 'Replaced 4 ceramic mixer cartridges and resealed supply couplings in sinks 101-104.',
        completedAt: '2026-10-04T12:00:00+08:00',
        technician: 'Zamri Plumber',
        costRM: 195,
        partsReplaced: '4x Sedal 35mm ceramic cartridges, EPDM O-rings',
      },
      verification: {
        status: 'Verified',
        preRepairAverageHourlyLitres: 280,
        postRepairAverageHourlyLitres: 160,
        reductionLitresPerHour: 120,
        dailySavedLitres: 2880,
        reductionPercent: 43,
        observationHours: 72,
        verifiedAt: '2026-10-07T14:00:00+08:00',
        notes: 'Continuous flow verified normalized. 2,880 L/day water saved.',
      },
      timeline: [
        {
          id: 'TL-16',
          timestamp: '2026-10-03T09:00:00+08:00',
          actor: 'Detection Engine',
          action: 'Sink drip anomaly ticket generated.',
        },
        {
          id: 'TL-17',
          timestamp: '2026-10-04T12:00:00+08:00',
          actor: 'Zamri Plumber',
          action: 'Replaced cartridges. Verified flow normalized.',
        },
      ],
    },
  ];

  return {
    buildings,
    readings,
    initialAlerts,
    initialInspections,
  };
}
