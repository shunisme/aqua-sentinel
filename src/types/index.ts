export type BuildingCategory =
  | 'Residential'
  | 'Hostel'
  | 'Laboratory'
  | 'Lecture Hall'
  | 'Library'
  | 'Sports Complex'
  | 'Administrative'
  | 'Dining & Retail';

export type CampusZone =
  | 'North Campus'
  | 'South Valley'
  | 'Science Park'
  | 'Residential Quarter'
  | 'Sports Hub';

export type AnomalyStatus = 'Normal' | 'Suspected Leak' | 'High Flow' | 'Under Inspection';

export type InspectionStatus =
  | 'None'
  | 'Open'
  | 'Assigned'
  | 'Inspecting'
  | 'Repair Required'
  | 'Repair Completed'
  | 'Verification Pending'
  | 'Verified'
  | 'False Positive'
  | 'Closed Without Repair';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type DetectionRuleType =
  | 'SPIKE'
  | 'CONTINUOUS_OVERNIGHT'
  | 'REPEATED_NIGHTTIME';

export type EvidenceStrength = 'High' | 'Moderate' | 'Preliminary';

export type AlertStatus =
  | 'New'
  | 'Acknowledged'
  | 'Under Investigation'
  | 'Inspection Created'
  | 'False Positive'
  | 'Resolved';

export interface Building {
  id: string;
  name: string;
  category: BuildingCategory;
  zone: CampusZone;
  floors: number;
  meterId: string;
  baselineDailyLitres: number;
  currentDailyLitres: number;
  expectedDailyLitres: number;
  latestReadingTimestamp: string;
  anomalyStatus: AnomalyStatus;
  openAlertsCount: number;
  inspectionStatus: InspectionStatus;
  priorityScore: number;
  description?: string;
  yearBuilt?: number;
}

export interface MeterReading {
  id: string;
  buildingId: string;
  meterId: string;
  timestamp: string; // ISO 8601
  consumptionLitres: number;
  expectedLitres: number;
  isAnomalous?: boolean;
  anomalyRule?: DetectionRuleType;
}

export interface AnomalyAlert {
  id: string;
  buildingId: string;
  buildingName: string;
  detectedAt: string;
  rule: DetectionRuleType;
  ruleName: string;
  severity: AlertSeverity;
  actualLitres: number;
  expectedLitres: number;
  estimatedExcessLitres: number;
  durationHours: number;
  explanation: string;
  evidenceStrength: EvidenceStrength;
  status: AlertStatus;
  recommendedAction: string;
  supportingReadings?: Array<{
    timestamp: string;
    actualLitres: number;
    expectedLitres: number;
  }>;
  falsePositiveReason?: string;
  resolutionNotes?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  inspectionId?: string;
}

export interface ScoreBreakdown {
  excessScore: number; // 0-100
  persistenceScore: number; // 0-100
  severityScore: number; // 0-100
  evidenceScore: number; // 0-100
  excessWeight: number; // e.g. 0.35
  persistenceWeight: number; // e.g. 0.25
  severityWeight: number; // e.g. 0.20
  evidenceWeight: number; // e.g. 0.20
  totalScore: number; // 0-100
  explanation: string;
}

export interface InspectionTimelineItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export interface InspectionFindings {
  causeSuspected: string;
  leakConfirmed: 'Yes' | 'No' | 'Inconclusive';
  notes: string;
  inspectedAt: string;
  inspector: string;
}

export interface RepairRecord {
  repairDescription: string;
  completedAt: string;
  technician: string;
  costRM: number;
  partsReplaced: string;
}

export interface VerificationResult {
  status: 'Pending' | 'Preliminary' | 'Verified' | 'Failed';
  preRepairAverageHourlyLitres: number;
  postRepairAverageHourlyLitres: number;
  reductionLitresPerHour: number;
  dailySavedLitres: number;
  reductionPercent: number;
  observationHours: number;
  verifiedAt?: string;
  notes: string;
}

export interface Inspection {
  id: string;
  alertId?: string;
  buildingId: string;
  buildingName: string;
  priorityScore: number;
  priorityTier: AlertSeverity;
  status: InspectionStatus;
  assignedInspector: string;
  createdAt: string;
  dueDate: string;
  urgencyReason: string;
  recommendedAction: string;
  estimatedExcessLitresDay: number;
  timeSinceAnomaly: string;
  scoreBreakdown: ScoreBreakdown;
  findings?: InspectionFindings;
  repair?: RepairRecord;
  verification?: VerificationResult;
  timeline: InspectionTimelineItem[];
}

export interface AppSettings {
  orgName: string;
  waterTariffRMPerM3: number;
  unitPreference: 'litres' | 'cubic_metres';
  lowUsageStartHour: number; // 1 (01:00)
  lowUsageEndHour: number; // 5 (05:00)
  spikeThresholdPercent: number; // 200 (%)
  minSpikeExcessLitres: number; // 150 (L)
  continuousFlowMinHours: number; // 3 (hours)
  continuousFlowThresholdLitres: number; // 80 (L/hr)
  repeatedNightThresholdPercent: number; // 150 (%)
  priorityWeights: {
    potentialExcess: number; // 35
    persistence: number; // 25
    severity: number; // 20
    evidenceStrength: number; // 20
  };
  priorityThresholds: {
    critical: number; // 80
    high: number; // 60
    medium: number; // 35
  };
}

export type NavigationPage =
  | 'overview'
  | 'buildings'
  | 'monitoring'
  | 'alerts'
  | 'queue'
  | 'maintenance'
  | 'impact'
  | 'data'
  | 'settings'
  | 'resident_portal'
  | 'technician_view';

export type UserRole = 'admin' | 'technician' | 'resident';

export type ThemeMode = 'handcrafted' | 'classic';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarInitials: string;
  isGuest?: boolean;
  assignedBuildingId?: string;
}

export type ResidentIssueType =
  | 'Running Toilet Cistern'
  | 'Dripping Sink Tap'
  | 'Leaking Shower Pipe'
  | 'Water Seeping from Ceiling'
  | 'Outdoor Pipe Breach'
  | 'Other';

export interface ResidentReport {
  id: string;
  buildingId: string;
  buildingName: string;
  floor: number;
  location: string;
  issueType: ResidentIssueType;
  description: string;
  reportedAt: string;
  status: 'Reported' | 'Assigned' | 'Inspected' | 'Resolved';
  reporterName: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
}

export interface RegisteredResident {
  id: string;
  name: string;
  email: string;
  matricNo: string;
  buildingId: string;
  roomNumber: string;
  phone?: string;
  registeredAt: string;
}
