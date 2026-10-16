import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSettings } from '../../types';
import {
  Settings,
  Sliders,
  Save,
  RotateCcw,
  RefreshCw,
  Info,
  DollarSign,
  Clock,
  Zap,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    rerunDetection,
    resetToDemoData,
    supabaseConfigured,
    supabaseUrl,
    setSupabaseCredentials,
  } = useApp();

  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseUrl || '');
  const [sbKey, setSbKey] = useState('');
  const [sbSavedNotice, setSbSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleRerun = () => {
    updateSettings(formSettings);
    rerunDetection();
  };

  const totalWeights =
    formSettings.priorityWeights.potentialExcess +
    formSettings.priorityWeights.persistence +
    formSettings.priorityWeights.severity +
    formSettings.priorityWeights.evidenceStrength;

  return (
    <div className="space-y-6 max-w-4xl w-full">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
              Platform Configuration & Analytical Parameters
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE] font-medium">
              ALGORITHM PARAMETERS
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Configure anomaly sensitivity thresholds, multi-factor priority weights, and campus water utility tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRerun}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Rerun Detection Engine</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Organisation & Financial Tariffs */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2563EB]" />
              <span>Campus Organisation & Utility Tariff (Financial Calculations)</span>
            </h2>
            <span className="text-[11px] text-[#64748B]">Affects financial loss and savings audit models</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Organisation / Campus Authority Name
              </label>
              <input
                type="text"
                value={formSettings.orgName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, orgName: e.target.value })
                }
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Water Utility Tariff (RM per m³) *
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="20"
                value={formSettings.waterTariffRMPerM3}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    waterTariffRMPerM3: parseFloat(e.target.value) || 2.20,
                  })
                }
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                Current standard: RM 2.20 / m³ (Air Selangor Commercial Band 1 / Educational Institution)
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Anomaly Detection Engine Sensitivity */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B9822B]" />
              <span>Telemetry Anomaly Detection Rules (SPIKE, CONTINUOUS_OVERNIGHT, REPEATED_NIGHTTIME)</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF3E7] text-[#B9822B] border border-[#ECD9B7]">
              DETECTION LOGIC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rule A Settings */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-md space-y-3 border border-[#E2E8F0]">
              <h3 className="text-xs font-semibold text-[#0F172A]">
                Rule 1: Unexpected Consumption Spike
              </h3>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Ratio Threshold (% of diurnal baseline)
                </label>
                <input
                  type="number"
                  min="120"
                  max="500"
                  value={formSettings.spikeThresholdPercent}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      spikeThresholdPercent: parseInt(e.target.value) || 200,
                    })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                />
                <span className="text-[10px] text-[#64748B]">Default: 200% (2.0x expected)</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Minimum Absolute Spike Delta (Litres/hour)
                </label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={formSettings.minSpikeExcessLitres}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      minSpikeExcessLitres: parseInt(e.target.value) || 150,
                    })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                />
                <span className="text-[10px] text-[#64748B]">Default: 150 L/hr excess</span>
              </div>
            </div>

            {/* Rule B Settings */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-md space-y-3 border border-[#E2E8F0]">
              <h3 className="text-xs font-semibold text-[#0F172A]">
                Rule 2: Continuous Overnight Baseline Flow
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                    Start Hour (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formSettings.lowUsageStartHour}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        lowUsageStartHour: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                    End Hour (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formSettings.lowUsageEndHour}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        lowUsageEndHour: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Consecutive Low-Usage Hours Required
                </label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={formSettings.continuousFlowMinHours}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      continuousFlowMinHours: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                />
                <span className="text-[10px] text-[#64748B]">Default: 3 continuous hours</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Overnight Minimum Floor Flow (L/hr)
                </label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={formSettings.continuousFlowThresholdLitres}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      continuousFlowThresholdLitres: parseInt(e.target.value) || 80,
                    })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
                />
                <span className="text-[10px] text-[#64748B]">Default: 80 L/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Smart Inspection Priority Score Weights */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#2563EB]" />
              <span>How Inspection Priority Scores Are Calculated</span>
            </h2>
          </div>

          {/* Formula & Calculation Method Explanation */}
          <div className="p-4 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] space-y-3 text-xs text-[#0F172A]">
            <p className="font-medium text-[#0F172A]">
              The Deterministic Multi-Factor Priority Score (0–100) is calculated as a weighted normalized composite of four operational metrics:
            </p>
            <div className="p-3 bg-white rounded border border-[#E2E8F0] font-mono text-[11px] text-[#0F2744]">
              Priority Score = (Excess Flow × {formSettings.priorityWeights.potentialExcess}%) + (Persistence × {formSettings.priorityWeights.persistence}%) + (Severity × {formSettings.priorityWeights.severity}%) + (Evidence × {formSettings.priorityWeights.evidenceStrength}%)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                <span className="font-semibold text-[#2563EB] block mb-1">1. Potential Excess Flow (0–100)</span>
                <span className="text-[#64748B]">
                  Evaluates daily excess volume in litres above expected baseline, scaled against an 8,000 L/day operational benchmark.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                <span className="font-semibold text-[#B9822B] block mb-1">2. Anomaly Persistence (0–100)</span>
                <span className="text-[#64748B]">
                  Measures total duration of abnormal low-usage hours plus recurring multi-night frequency factors.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                <span className="font-semibold text-[#B54747] block mb-1">3. Pattern Severity (0–100)</span>
                <span className="text-[#64748B]">
                  Engineering severity rating: Critical = 100 pts, High = 75 pts, Medium = 50 pts, Low = 25 pts.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F2744] block mb-1">4. Evidence Strength (0–100)</span>
                <span className="text-[#64748B]">
                  Telemetry confidence score: High = 100 pts, Moderate = 65 pts, Preliminary = 35 pts.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#0F172A]">1. Potential Excess Volume Weight:</span>
                <span className="text-[#2563EB] font-mono font-semibold">
                  {formSettings.priorityWeights.potentialExcess}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={formSettings.priorityWeights.potentialExcess}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    priorityWeights: {
                      ...formSettings.priorityWeights,
                      potentialExcess: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-[#2563EB] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#0F172A]">2. Anomaly Persistence Weight:</span>
                <span className="text-[#B9822B] font-mono font-semibold">
                  {formSettings.priorityWeights.persistence}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={formSettings.priorityWeights.persistence}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    priorityWeights: {
                      ...formSettings.priorityWeights,
                      persistence: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-[#B9822B] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#0F172A]">3. Pattern Severity Weight:</span>
                <span className="text-[#B54747] font-mono font-semibold">
                  {formSettings.priorityWeights.severity}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={formSettings.priorityWeights.severity}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    priorityWeights: {
                      ...formSettings.priorityWeights,
                      severity: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-[#B54747] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-[#0F172A]">4. Evidence Strength Weight:</span>
                <span className="text-[#0F2744] font-mono font-semibold">
                  {formSettings.priorityWeights.evidenceStrength}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={formSettings.priorityWeights.evidenceStrength}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    priorityWeights: {
                      ...formSettings.priorityWeights,
                      evidenceStrength: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-[#0F2744] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Supabase Cloud Auth & Database Connection */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2C5B83]" />
              <span>Supabase Cloud Authentication & Persistence</span>
            </h2>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium flex items-center gap-1.5 ${
                supabaseConfigured
                  ? 'bg-[#EBF5EE] text-[#2E6F56] border border-[#CCE6D5]'
                  : 'bg-[#F2ECE1] text-[#8C6B2D] border border-[#E0D3BE]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  supabaseConfigured ? 'bg-[#2E6F56] animate-pulse' : 'bg-[#B27B2A]'
                }`}
              />
              {supabaseConfigured ? 'SUPABASE CONNECTED' : 'SUPABASE UNCONFIGURED'}
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Aqua Sentinel connects to Supabase for multi-role authentication (Facility Admin, Repair Worker, Resident) and cloud session synchronization.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2C5B83] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Supabase Anon Public API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2C5B83] text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#64748B]">
              Credentials can also be stored in <code className="bg-[#F1F5F9] px-1 py-0.5 rounded text-[#0F172A]">.env</code> as <code className="bg-[#F1F5F9] px-1 py-0.5 rounded text-[#0F172A]">VITE_SUPABASE_URL</code> and <code className="bg-[#F1F5F9] px-1 py-0.5 rounded text-[#0F172A]">VITE_SUPABASE_ANON_KEY</code>.
            </span>
            <button
              type="button"
              onClick={() => {
                setSupabaseCredentials(sbUrl, sbKey);
                setSbSavedNotice(true);
                setTimeout(() => setSbSavedNotice(false), 3000);
              }}
              className="px-3.5 py-1.5 bg-[#1A2838] hover:bg-[#2A3C50] text-white rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#89B3D9]" />
              <span>Apply Supabase Keys</span>
            </button>
          </div>

          {sbSavedNotice && (
            <p className="text-xs text-[#2E6F56] font-medium font-mono">
              ✓ Supabase connection keys updated and re-initialized.
            </p>
          )}
        </div>

        {/* Save and Rerun Bar */}
        <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isSaved ? (
              <span className="text-[#2D6A4F] font-medium flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                Parameters successfully saved to local storage.
              </span>
            ) : (
              <span className="text-[#64748B]">
                Click save configuration or rerun engine to re-score telemetry.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleRerun}
              className="px-4 py-2 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Save & Rerun Engine
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
