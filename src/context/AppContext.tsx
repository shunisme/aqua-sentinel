import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Building,
  MeterReading,
  AnomalyAlert,
  Inspection,
  AppSettings,
  NavigationPage,
  InspectionStatus,
  InspectionFindings,
  RepairRecord,
  UserRole,
  UserProfile,
  ResidentReport,
  RegisteredResident,
  ThemeMode,
} from '../types';
import { generateDemoDataset, DEFAULT_SETTINGS } from '../services/demoData';
import { runAnomalyDetection } from '../services/anomalyDetection';
import { calculateBuildingPriorityScore } from '../services/priorityScorer';
import { verifyRepairOutcome } from '../services/verificationEngine';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  signInWithSupabase,
  signUpWithSupabase,
  signOutSupabase,
  onSupabaseAuthStateChange,
} from '../services/supabase';

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    name: 'Eng. Faizul Rahman',
    email: 'faizul@um.edu.my',
    role: 'admin',
    roleTitle: 'Facility Admin',
    avatarInitials: 'FR',
  },
  technician: {
    name: 'Ahmad Faiz',
    email: 'ahmad.faiz@um.edu.my',
    role: 'technician',
    roleTitle: 'Repair Worker',
    avatarInitials: 'AF',
  },
  resident: {
    name: 'Nur Aisyah',
    email: 'aisyah@siswa.um.edu.my',
    role: 'resident',
    roleTitle: 'Resident',
    avatarInitials: 'NA',
    assignedBuildingId: 'BLD-102',
  },
};

export const GUEST_USERS: Record<UserRole, UserProfile> = {
  admin: {
    name: 'Guest Facility Admin',
    email: 'guest.admin@aquasentinel.local',
    role: 'admin',
    roleTitle: 'Facility Admin (Guest)',
    avatarInitials: 'GA',
    isGuest: true,
  },
  technician: {
    name: 'Guest Repair Worker',
    email: 'guest.tech@aquasentinel.local',
    role: 'technician',
    roleTitle: 'Repair Worker (Guest)',
    avatarInitials: 'GT',
    isGuest: true,
  },
  resident: {
    name: 'Guest Resident',
    email: 'guest.resident@aquasentinel.local',
    role: 'resident',
    roleTitle: 'Resident (Guest)',
    avatarInitials: 'GR',
    assignedBuildingId: 'BLD-102',
    isGuest: true,
  },
};

const INITIAL_REGISTERED_RESIDENTS: RegisteredResident[] = [
  {
    id: 'RES-001',
    name: 'Nur Aisyah',
    email: 'aisyah@siswa.um.edu.my',
    matricNo: 'U2102845',
    buildingId: 'BLD-102',
    roomNumber: 'Block C, Room 302',
    phone: '+60 12-345 6789',
    registeredAt: '2026-09-01T08:00:00+08:00',
  },
  {
    id: 'RES-002',
    name: 'Kevin Lim',
    email: 'kevin.lim@siswa.um.edu.my',
    matricNo: 'U2001923',
    buildingId: 'BLD-101',
    roomNumber: 'Block A, Room 105',
    phone: '+60 17-890 1234',
    registeredAt: '2026-09-03T10:30:00+08:00',
  },
  {
    id: 'RES-003',
    name: 'Farah Nadia',
    email: 'farah.nadia@siswa.um.edu.my',
    matricNo: 'U2203112',
    buildingId: 'BLD-102',
    roomNumber: 'Block C, Room 204',
    phone: '+60 19-456 7890',
    registeredAt: '2026-09-05T14:15:00+08:00',
  },
];

const INITIAL_RESIDENT_REPORTS: ResidentReport[] = [
  {
    id: 'RR-2026-001',
    buildingId: 'BLD-102',
    buildingName: 'Kolej Kediaman 5 (Block C)',
    floor: 3,
    location: 'Level 3 Male Washroom - Cubicle 2',
    issueType: 'Running Toilet Cistern',
    description: 'Toilet bowl in cubicle 2 has water constantly trickling into bowl, loud hissing sound all night.',
    reportedAt: '2026-10-11T20:30:00+08:00',
    status: 'Assigned',
    reporterName: 'Nur Aisyah',
    urgency: 'High',
  },
  {
    id: 'RR-2026-002',
    buildingId: 'BLD-103',
    buildingName: 'Faculty of Engineering (Block E Labs)',
    floor: 3,
    location: 'Civil Lab Level 3 Restroom',
    issueType: 'Running Toilet Cistern',
    description: 'Multiple cisterns leaking into bowls after flushing.',
    reportedAt: '2026-10-09T09:15:00+08:00',
    status: 'Resolved',
    reporterName: 'Kevin Lim (Student)',
    urgency: 'Medium',
  },
  {
    id: 'RR-2026-003',
    buildingId: 'BLD-106',
    buildingName: 'Biotech Research Annex & Cleanroom',
    floor: 2,
    location: 'Cleanroom Scrub Sink',
    issueType: 'Dripping Sink Tap',
    description: 'Cold water tap drips continuously even when tightened firmly.',
    reportedAt: '2026-10-12T14:20:00+08:00',
    status: 'Reported',
    reporterName: 'Farah Nadia',
    urgency: 'Low',
  },
];

interface AppContextType {
  buildings: Building[];
  readings: MeterReading[];
  alerts: AnomalyAlert[];
  inspections: Inspection[];
  settings: AppSettings;
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  selectedInspectionId: string | null;
  setSelectedInspectionId: (id: string | null) => void;
  dateFilter: 'today' | '7d' | '30d' | 'all';
  setDateFilter: (filter: 'today' | '7d' | '30d' | 'all') => void;
  isDemoMode: boolean;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, notes: string) => void;
  markAlertFalsePositive: (alertId: string, reason: string) => void;
  createInspection: (data: {
    buildingId: string;
    alertId?: string;
    assignedInspector: string;
    dueDate: string;
    urgencyReason?: string;
    recommendedAction?: string;
  }) => Inspection;
  updateInspectionStatus: (id: string, status: InspectionStatus, note?: string) => void;
  recordInspectionFindings: (id: string, findings: InspectionFindings) => void;
  recordRepair: (id: string, repair: RepairRecord) => void;
  verifyInspectionRepair: (id: string) => void;
  addBuilding: (building: Building) => void;
  updateBuilding: (building: Building) => void;
  importReadings: (newReadings: MeterReading[]) => { importedCount: number; duplicateCount: number };
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  rerunDetection: () => void;
  resetToDemoData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Authentication & Role Management
  currentUser: UserProfile;
  isAuthenticated: boolean;
  login: (role: UserRole, customProfile?: Partial<UserProfile>) => void;
  loginAsGuest: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;

  // Supabase Auth & Configuration
  supabaseConfigured: boolean;
  supabaseUrl: string;
  setSupabaseCredentials: (url: string, key: string) => void;
  signInWithSupabaseAuth: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithSupabaseAuth: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    assignedBuildingId?: string
  ) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;

  // Resident Management
  registeredResidents: RegisteredResident[];
  addResident: (resident: Omit<RegisteredResident, 'id' | 'registeredAt'>) => RegisteredResident;
  selectResident: (residentId: string) => void;

  // Resident Reports
  residentReports: ResidentReport[];
  submitResidentReport: (report: Omit<ResidentReport, 'id' | 'reportedAt' | 'status'>) => void;
  updateResidentReportStatus: (id: string, status: ResidentReport['status']) => void;

  // Theme & Design Revert
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'aqua_sentinel_settings_v4',
  BUILDINGS: 'aqua_sentinel_buildings_v4',
  READINGS: 'aqua_sentinel_readings_v4',
  ALERTS: 'aqua_sentinel_alerts_v4',
  INSPECTIONS: 'aqua_sentinel_inspections_v4',
  USER_SESSION: 'aqua_sentinel_user_session_v4',
  RESIDENT_REPORTS: 'aqua_sentinel_resident_reports_v4',
  REGISTERED_RESIDENTS: 'aqua_sentinel_registered_residents_v4',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEMO_USERS.admin;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return !!saved;
  });

  const [residentReports, setResidentReports] = useState<ResidentReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESIDENT_REPORTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_RESIDENT_REPORTS;
  });

  const [registeredResidents, setRegisteredResidents] = useState<RegisteredResident[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_RESIDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_REGISTERED_RESIDENTS;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Theme & Design Revert State (Default to handcrafted editorial design as requested)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('aqua_sentinel_theme') as ThemeMode) || 'handcrafted';
  });

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'handcrafted' ? 'classic' : 'handcrafted';
      localStorage.setItem('aqua_sentinel_theme', next);
      showToast(next === 'handcrafted' ? 'Switched to Handcrafted Editorial Design' : 'Reverted to Classic Enterprise Design');
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('aqua_sentinel_theme', themeMode);
    if (themeMode === 'handcrafted') {
      document.documentElement.classList.add('theme-handcrafted');
      document.documentElement.classList.remove('theme-classic');
    } else {
      document.documentElement.classList.add('theme-classic');
      document.documentElement.classList.remove('theme-handcrafted');
    }
  }, [themeMode]);

  // Supabase Configuration State
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => getSupabaseConfig().url);

  // Listen to Supabase auth changes
  useEffect(() => {
    const unsubscribe = onSupabaseAuthStateChange((_event, session, profile) => {
      if (session && profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(profile));
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const setSupabaseCredentials = (url: string, key: string) => {
    saveSupabaseConfig(url, key);
    const configured = isSupabaseConfigured();
    setSupabaseConfigured(configured);
    setSupabaseUrl(url);
    showToast(configured ? 'Supabase connected successfully!' : 'Supabase configuration saved.');
  };

  const signInWithSupabaseAuth = async (email: string, password: string) => {
    const res = await signInWithSupabase(email, password);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(res.user));

      if (res.user.role === 'resident') {
        setCurrentPage('resident_portal');
      } else if (res.user.role === 'technician') {
        setCurrentPage('technician_view');
      } else {
        setCurrentPage('overview');
      }

      showToast(`Signed in as ${res.user.name} (${res.user.roleTitle})`);
      return { success: true };
    }
    return { success: false, error: 'Sign in failed.' };
  };

  const signUpWithSupabaseAuth = async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    assignedBuildingId?: string
  ) => {
    const res = await signUpWithSupabase(email, password, role, fullName, assignedBuildingId);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.emailConfirmationRequired) {
      showToast('Registration successful! Please check your email inbox to confirm.');
      return { success: true, confirmationRequired: true };
    }
    if (res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(res.user));

      if (res.user.role === 'resident') {
        setCurrentPage('resident_portal');
      } else if (res.user.role === 'technician') {
        setCurrentPage('technician_view');
      } else {
        setCurrentPage('overview');
      }

      showToast(`Account created and signed in as ${res.user.name}`);
      return { success: true };
    }
    return { success: false, error: 'Registration failed.' };
  };

  // Auth methods
  const login = (role: UserRole, customProfile?: Partial<UserProfile>) => {
    const base = DEMO_USERS[role];
    const user: UserProfile = { ...base, ...customProfile, isGuest: false };
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));

    if (role === 'resident') {
      setCurrentPage('resident_portal');
    } else if (role === 'technician') {
      setCurrentPage('technician_view');
    } else {
      setCurrentPage('overview');
    }

    showToast(`Signed in as ${user.name} (${user.roleTitle})`);
  };

  const loginAsGuest = (role: UserRole) => {
    const user = GUEST_USERS[role];
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));

    if (role === 'resident') {
      setCurrentPage('resident_portal');
    } else if (role === 'technician') {
      setCurrentPage('technician_view');
    } else {
      setCurrentPage('overview');
    }

    showToast(`Continuing as Guest (${user.roleTitle})`);
  };

  const logout = async () => {
    try {
      await signOutSupabase();
    } catch (e) {}
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    showToast('Signed out of Aqua Sentinel session.');
  };

  const switchRole = (newRole: UserRole) => {
    const user = currentUser.isGuest ? GUEST_USERS[newRole] : DEMO_USERS[newRole];
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));

    if (newRole === 'resident') {
      setCurrentPage('resident_portal');
    } else if (newRole === 'technician') {
      setCurrentPage('technician_view');
    } else {
      setCurrentPage('overview');
    }

    showToast(`Switched active view to ${user.roleTitle}`);
  };

  // Initial state setup from demo data or localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateDemoDataset().buildings;
  });

  const [readings, setReadings] = useState<MeterReading[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.READINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateDemoDataset().readings;
  });

  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateDemoDataset().initialAlerts;
  });

  const [inspections, setInspections] = useState<Inspection[]>(() => {
    const demoInits = generateDemoDataset().initialInspections;
    const saved = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    if (saved) {
      try {
        const parsed: Inspection[] = JSON.parse(saved);
        const missing = demoInits.filter((init) => !parsed.some((p) => p.id === init.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {}
    }
    return demoInits;
  });

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
    } catch (e) {}
  }, [buildings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
    } catch (e) {}
  }, [inspections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESIDENT_REPORTS, JSON.stringify(residentReports));
    } catch (e) {}
  }, [residentReports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_RESIDENTS, JSON.stringify(registeredResidents));
    } catch (e) {}
  }, [registeredResidents]);

  // Alert Actions
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'Acknowledged',
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      )
    );
    showToast(`Alert acknowledged successfully.`);
  };

  const resolveAlert = (alertId: string, notes: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'Resolved',
              resolvedAt: new Date().toISOString(),
              resolutionNotes: notes,
            }
          : a
      )
    );
    showToast(`Alert resolved.`);
  };

  const markAlertFalsePositive = (alertId: string, reason: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'False Positive',
              falsePositiveReason: reason,
              resolvedAt: new Date().toISOString(),
            }
          : a
      )
    );
    showToast(`Alert marked as False Positive.`);
  };

  // Inspection Actions
  const createInspection = (data: {
    buildingId: string;
    alertId?: string;
    assignedInspector: string;
    dueDate: string;
    urgencyReason?: string;
    recommendedAction?: string;
  }): Inspection => {
    const building = buildings.find((b) => b.id === data.buildingId);
    const buildingName = building?.name || data.buildingId;
    const alert = data.alertId ? alerts.find((a) => a.id === data.alertId) : undefined;

    const scoreResult = building
      ? calculateBuildingPriorityScore(building, alerts, settings)
      : {
          score: 75,
          tier: 'High' as const,
          breakdown: {
            excessScore: 70,
            persistenceScore: 70,
            severityScore: 80,
            evidenceScore: 80,
            excessWeight: 0.35,
            persistenceWeight: 0.25,
            severityWeight: 0.2,
            evidenceWeight: 0.2,
            totalScore: 75,
            explanation: 'Manual inspection dispatch',
          },
          urgencyReason: data.urgencyReason || 'Inspection requested by facility operator.',
          recommendedAction: data.recommendedAction || 'Execute on-site piping inspection.',
        };

    const newId = `INS-2026-${String(inspections.length + 1).padStart(3, '0')}`;
    const newInspection: Inspection = {
      id: newId,
      alertId: data.alertId,
      buildingId: data.buildingId,
      buildingName,
      priorityScore: scoreResult.score,
      priorityTier: scoreResult.tier,
      status: 'Assigned',
      assignedInspector: data.assignedInspector || 'On-Call Technician',
      createdAt: new Date().toISOString(),
      dueDate: data.dueDate,
      urgencyReason: data.urgencyReason || scoreResult.urgencyReason,
      recommendedAction: data.recommendedAction || scoreResult.recommendedAction,
      estimatedExcessLitresDay: alert ? alert.estimatedExcessLitres * 24 : 2000,
      timeSinceAnomaly: 'Active',
      scoreBreakdown: scoreResult.breakdown,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: currentUser.name,
          action: `Inspection created and assigned to ${data.assignedInspector || 'Technician'}.`,
        },
      ],
    };

    setInspections((prev) => [newInspection, ...prev]);

    if (data.alertId) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === data.alertId
            ? { ...a, status: 'Inspection Created', inspectionId: newId }
            : a
        )
      );
    }

    setBuildings((prev) =>
      prev.map((b) =>
        b.id === data.buildingId
          ? { ...b, inspectionStatus: 'Assigned', anomalyStatus: 'Under Inspection' }
          : b
      )
    );

    showToast(`Inspection ticket ${newId} created successfully.`);
    return newInspection;
  };

  const updateInspectionStatus = (id: string, status: InspectionStatus, note?: string) => {
    setInspections((prev) =>
      prev.map((ins) => {
        if (ins.id === id) {
          const newTimeline = [
            ...ins.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actor: currentUser.name,
              action: `Status updated to ${status}${note ? `: ${note}` : ''}`,
            },
          ];
          return {
            ...ins,
            status,
            timeline: newTimeline,
          };
        }
        return ins;
      })
    );

    const target = inspections.find((i) => i.id === id);
    if (target) {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === target.buildingId ? { ...b, inspectionStatus: status } : b
        )
      );
    }

    showToast(`Inspection status updated to ${status}.`);
  };

  const recordInspectionFindings = (id: string, findings: InspectionFindings) => {
    setInspections((prev) =>
      prev.map((ins) => {
        if (ins.id === id) {
          const nextStatus: InspectionStatus =
            findings.leakConfirmed === 'Yes'
              ? 'Repair Required'
              : findings.leakConfirmed === 'No'
              ? 'Closed Without Repair'
              : 'Inspecting';

          return {
            ...ins,
            findings,
            status: nextStatus,
            timeline: [
              ...ins.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: findings.inspector,
                action: `Findings recorded (Leak Confirmed: ${findings.leakConfirmed}). Status changed to ${nextStatus}.`,
                note: findings.notes,
              },
            ],
          };
        }
        return ins;
      })
    );
    showToast(`Inspection findings recorded.`);
  };

  const recordRepair = (id: string, repair: RepairRecord) => {
    const target = inspections.find((i) => i.id === id);
    const dailySaved = target?.estimatedExcessLitresDay || 2400;

    setInspections((prev) =>
      prev.map((ins) => {
        if (ins.id === id) {
          return {
            ...ins,
            repair,
            status: 'Verified',
            priorityScore: 15,
            verification: {
              status: 'Verified',
              preRepairAverageHourlyLitres: 180,
              postRepairAverageHourlyLitres: 20,
              reductionLitresPerHour: 160,
              reductionPercent: 88,
              dailySavedLitres: dailySaved,
              observationHours: 24,
              verifiedAt: new Date().toISOString(),
              notes: `Repair completed: ${repair.repairDescription}. Flow restored.`,
            },
            timeline: [
              ...ins.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: repair.technician,
                action: `Repair completed: ${repair.repairDescription}. Recorded as completed and reported to facility admin.`,
              },
            ],
          };
        }
        return ins;
      })
    );

    if (target) {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === target.buildingId
            ? { ...b, anomalyStatus: 'Normal', inspectionStatus: 'Verified', priorityScore: 15 }
            : b
        )
      );

      if (target.alertId) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === target.alertId
              ? {
                  ...a,
                  status: 'Resolved',
                  resolvedAt: new Date().toISOString(),
                  resolutionNotes: `Repaired: ${repair.repairDescription}. Recorded as completed.`,
                }
              : a
          )
        );
      }
    }

    showToast(`Repair recorded as completed and reported to admin.`);
  };

  const verifyInspectionRepair = (id: string) => {
    const ins = inspections.find((i) => i.id === id);
    if (!ins || !ins.repair) return;

    const analysis = verifyRepairOutcome(
      ins.buildingId,
      ins.repair,
      readings,
      settings.waterTariffRMPerM3
    );

    setInspections((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            verification: analysis.result,
            status: analysis.result.status === 'Verified' ? 'Verified' : item.status,
            priorityScore: analysis.result.status === 'Verified' ? 15 : item.priorityScore,
            timeline: [
              ...item.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Verification Engine',
                action: `Repair telemetry analyzed: ${analysis.result.status} (${analysis.result.reductionPercent}% reduction confirmed).`,
                note: analysis.result.notes,
              },
            ],
          };
        }
        return item;
      })
    );

    showToast(`Verification run: Status is ${analysis.result.status} (${analysis.result.reductionPercent}% reduction).`);
  };

  const addBuilding = (building: Building) => {
    setBuildings((prev) => [building, ...prev]);
    showToast(`Building ${building.name} registered.`);
  };

  const updateBuilding = (building: Building) => {
    setBuildings((prev) => prev.map((b) => (b.id === building.id ? building : b)));
    showToast(`Building ${building.name} updated.`);
  };

  const importReadings = (newReadings: MeterReading[]) => {
    const existingTimestamps = new Set(
      readings.map((r) => `${r.buildingId}_${r.timestamp}`)
    );

    const validUnique: MeterReading[] = [];
    let duplicates = 0;

    newReadings.forEach((r) => {
      const key = `${r.buildingId}_${r.timestamp}`;
      if (existingTimestamps.has(key)) {
        duplicates++;
      } else {
        existingTimestamps.add(key);
        validUnique.push(r);
      }
    });

    const combined = [...readings, ...validUnique];
    setReadings(combined);

    const names: Record<string, string> = {};
    buildings.forEach((b) => {
      names[b.id] = b.name;
    });

    const detectionRes = runAnomalyDetection(combined, names, settings, alerts);
    setAlerts(detectionRes.alerts);

    setBuildings((prev) =>
      prev.map((b) => {
        const last24 = combined.filter((r) => r.buildingId === b.id).slice(-24);
        const currentDailyLitres =
          last24.length > 0 ? last24.reduce((s, r) => s + r.consumptionLitres, 0) : b.currentDailyLitres;
        const bAlerts = detectionRes.alerts.filter((a) => a.buildingId === b.id && a.status !== 'Resolved');
        const scoreRes = calculateBuildingPriorityScore({ ...b, currentDailyLitres }, detectionRes.alerts, settings);
        return {
          ...b,
          currentDailyLitres,
          openAlertsCount: bAlerts.length,
          priorityScore: scoreRes.score,
        };
      })
    );

    showToast(`Imported ${validUnique.length} readings (${duplicates} duplicates skipped). Detection rerun.`);
    return { importedCount: validUnique.length, duplicateCount: duplicates };
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    showToast(`Settings updated.`);
  };

  const rerunDetection = () => {
    const names: Record<string, string> = {};
    buildings.forEach((b) => {
      names[b.id] = b.name;
    });

    const res = runAnomalyDetection(readings, names, settings, alerts);
    setAlerts(res.alerts);

    setBuildings((prev) =>
      prev.map((b) => {
        const scoreRes = calculateBuildingPriorityScore(b, res.alerts, settings);
        const bAlerts = res.alerts.filter((a) => a.buildingId === b.id && a.status !== 'Resolved');
        return {
          ...b,
          openAlertsCount: bAlerts.length,
          priorityScore: scoreRes.score,
        };
      })
    );

    showToast(`Detection engine evaluated ${readings.length} readings: ${res.alerts.length} active alerts.`);
  };

  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.BUILDINGS);
    localStorage.removeItem(STORAGE_KEYS.READINGS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
    localStorage.removeItem(STORAGE_KEYS.RESIDENT_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.REGISTERED_RESIDENTS);

    const demo = generateDemoDataset();
    setSettings(DEFAULT_SETTINGS);
    setBuildings(demo.buildings);
    setReadings(demo.readings);
    setAlerts(demo.initialAlerts);
    setInspections(demo.initialInspections);
    setResidentReports(INITIAL_RESIDENT_REPORTS);
    setRegisteredResidents(INITIAL_REGISTERED_RESIDENTS);

    showToast(`All data reset to factory demo campus dataset.`);
  };

  // Resident Registration Actions
  const addResident = (data: Omit<RegisteredResident, 'id' | 'registeredAt'>): RegisteredResident => {
    const newRes: RegisteredResident = {
      ...data,
      id: `RES-${String(registeredResidents.length + 1).padStart(3, '0')}`,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredResidents((prev) => [newRes, ...prev]);

    const initials = newRes.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'RS';

    const userProfile: UserProfile = {
      name: newRes.name,
      email: newRes.email,
      role: 'resident',
      roleTitle: `Resident (${newRes.roomNumber})`,
      avatarInitials: initials,
      assignedBuildingId: newRes.buildingId,
    };
    setCurrentUser(userProfile);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(userProfile));
    showToast(`Resident ${newRes.name} registered and activated for ${newRes.roomNumber}!`);
    return newRes;
  };

  const selectResident = (residentId: string) => {
    const target = registeredResidents.find((r) => r.id === residentId);
    if (!target) return;

    const initials = target.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'RS';

    const userProfile: UserProfile = {
      name: target.name,
      email: target.email,
      role: 'resident',
      roleTitle: `Resident (${target.roomNumber})`,
      avatarInitials: initials,
      assignedBuildingId: target.buildingId,
    };
    setCurrentUser(userProfile);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(userProfile));
    showToast(`Switched active resident to ${target.name} (${target.roomNumber})`);
  };

  // Resident Reports Actions
  const submitResidentReport = (report: Omit<ResidentReport, 'id' | 'reportedAt' | 'status'>) => {
    const newReport: ResidentReport = {
      ...report,
      id: `RR-2026-${String(residentReports.length + 1).padStart(3, '0')}`,
      reportedAt: new Date().toISOString(),
      status: 'Reported',
    };
    setResidentReports((prev) => [newReport, ...prev]);
    showToast(`Leak report #${newReport.id} logged! Facilities team notified.`);
  };

  const updateResidentReportStatus = (id: string, status: ResidentReport['status']) => {
    setResidentReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    showToast(`Resident report status updated to ${status}`);
  };

  return (
    <AppContext.Provider
      value={{
        buildings,
        readings,
        alerts,
        inspections,
        settings,
        currentPage,
        setCurrentPage,
        selectedBuildingId,
        setSelectedBuildingId,
        selectedAlertId,
        setSelectedAlertId,
        selectedInspectionId,
        setSelectedInspectionId,
        dateFilter,
        setDateFilter,
        isDemoMode: true,
        acknowledgeAlert,
        resolveAlert,
        markAlertFalsePositive,
        createInspection,
        updateInspectionStatus,
        recordInspectionFindings,
        recordRepair,
        verifyInspectionRepair,
        addBuilding,
        updateBuilding,
        importReadings,
        updateSettings,
        rerunDetection,
        resetToDemoData,
        searchQuery,
        setSearchQuery,
        toastMessage,
        showToast,
        currentUser,
        isAuthenticated,
        login,
        loginAsGuest,
        logout,
        switchRole,
        supabaseConfigured,
        supabaseUrl,
        setSupabaseCredentials,
        signInWithSupabaseAuth,
        signUpWithSupabaseAuth,
        registeredResidents,
        addResident,
        selectResident,
        residentReports,
        submitResidentReport,
        updateResidentReportStatus,
        themeMode,
        toggleThemeMode,
        setThemeMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
