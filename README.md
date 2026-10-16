# Aqua Sentinel — Smart Water Leak Detection & Inspection Prioritisation Platform

> **"Detect the unseen. Save every drop."**

**Aqua Sentinel** is an enterprise-grade software intelligence platform built on top of municipal and facility water meters. It analyzes time-series telemetry, flags suspicious consumption patterns, ranks buildings by multi-factor inspection urgency, orchestrates end-to-end repair workflows, and empirically verifies water savings after maintenance.

Designed for university facility directors, municipal operators, commercial property managers, and sustainability officers.

---

## 🌟 Key Innovations

1. **Suspected vs. Confirmed Leakage Principle**:
   Abnormal consumption is evidence for prioritized investigation, not mathematical certainty of a pipe burst. Aqua Sentinel distinguishes suspected anomalies from verified physical leaks.
2. **Multi-Role Stakeholder Architecture (Admin, Repair Worker, Resident)**:
   Includes specialized views for:
   - **Facility Operations Admin**: Campus-wide command center, analytics, detection thresholds, priority queue governance.
   - **Field Repair Worker / Technician**: Mobile-ready work order roster, physical findings logger, repair cost entry, telemetry verification.
   - **Hostel Resident / Student**: Building water health grade, leak report form (floors, fixtures), and campus college eco-cup leaderboard.
   - **Instant Guest Mode**: Try any of the 3 roles immediately without signing in!
3. **Deterministic Multi-Rule Detection Engine**:
   Operates 100% deterministically in TypeScript without stochastic external LLM hallucinations or black-box APIs.
4. **Transparent Inspection Priority Queue (Signature Feature)**:
   Normalizes disparate metrics (volume, persistence, severity, evidence confidence) onto a 0–100 scale using configurable mathematical weighting.
5. **Empirical Post-Repair Verification**:
   Compares pre-repair baselines against post-repair continuous telemetry to verify actual flow reductions, distinguishing *Preliminary* from *Verified* savings.
6. **Zero-Config Campus Dataset**:
   Launches out-of-the-box with 20 realistic Universiti Malaya campus facilities across 14 days of hourly diurnal telemetry, modeling 6 distinct real-world scenarios.

---

## 🏗️ Technology Stack

- **Framework**: React 18, TypeScript (Strict Mode)
- **Bundler & Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom Aqua/Navy palette
- **Data Visualisation**: Recharts (Composed time-series, diurnal area charts, severity pies, horizontal priority bars)
- **Icons**: Lucide React
- **Persistence**: Browser `localStorage` with real-time recalculation fallback
- **Target Platform**: Desktop, tablet, and mobile; 100% Vercel compatible

---

## 🧭 Navigation Structure

Aqua Sentinel consists of 9 fully functional views:

1. **Overview Dashboard**:
   - 6 calculated KPI cards: Total consumption today, active anomaly alerts, potential daily excess, facilities requiring inspection, completed repairs, verified savings.
   - Dual-series time-series trend chart (Actual vs. Expected baseline).
   - Alert severity distribution chart.
   - Highest-priority facilities table with 1-click inspection dispatch.
   - Recent maintenance & anomaly audit feed.
2. **Campus Buildings**:
   - Full directory of 20 university facilities across North Campus, South Valley, Science Park, Residential Quarter, and Sports Hub.
   - Filtering by Category and Anomaly Status; sorting by Priority Score, Consumption, Excess, and Name.
   - Card/Grid view and Table view toggle.
   - Deep-dive Facility Drawer: 48-hour hourly telemetry profile, meter identifiers, active alerts, and inspection history.
   - "Register Facility" and "Edit Facility" modals.
3. **Water Monitoring**:
   - Facility-level or campus-aggregated view.
   - Time ranges: 24 Hours, 7 Days, 14 Days, 30 Days.
   - Granularity: Hourly vs. Daily aggregation.
   - Unit toggle: Litres (L) vs. Cubic Metres (m³) with consistent unit conversion ($1\text{ m}^3 = 1,000\text{ L}$).
   - Visual red anomaly markers indicating rule violations.
   - Searchable, paginated telemetry reading entries with instant CSV export.
4. **Leak Alerts**:
   - Filter by Severity (Critical, High, Medium, Low), Rule type, and Status.
   - Clear distinction between *Alert Severity* (volume risk) and *Evidence Strength* (telemetry confidence).
   - Alert detail modal with localized ±36h anomaly window telemetry chart.
   - Interactive actions: Acknowledge, Dispatch Inspection, Mark as False Positive (requires justification), Resolve.
5. **Smart Inspection Queue (Signature Feature)**:
   - Priority-ranked facility queue ordered by normalized 0–100 urgency score.
   - Audit Modal: Reveals the exact mathematical contribution of Excess (35%), Persistence (25%), Severity (20%), and Evidence (20%).
   - One-click technician dispatching and due-date scheduling.
6. **Maintenance & Workflows**:
   - Full lifecycle pipeline: `Open` → `Assigned` → `Inspecting` → `Repair Required` → `Repair Completed` → `Verification Pending` → `Verified` (plus `False Positive` & `Closed`).
   - Dual Table and Kanban Pipeline views.
   - "Record Findings" modal (root cause, physical leak confirmed Y/N).
   - "Record Repair" modal (parts replaced, technician name, direct cost in RM).
   - "Verify Telemetry" engine trigger.
   - Persistent step-by-step activity audit timeline.
7. **Impact Reports & Water Savings**:
   - Verified daily savings (L/day), cumulative volume saved (L), and financial ROI in Malaysian Ringgit (RM).
   - Before-and-after empirical flow comparison chart.
   - Scenario E deep-dive case study (Engineering Block E cistern overhaul).
   - Instant CSV Exporters: Alerts CSV, Inspections CSV, Repair Outcomes CSV, Consumption Summary CSV.
8. **Data Management & CSV Import**:
   - Bulk CSV upload with drag-and-drop.
   - Client-side validation: Required columns, ISO timestamps, positive numeric flow, and unknown building ID detection.
   - Row-level validation summary preview with line-by-line error flags.
   - Downloadable CSV template.
   - "Restore Demo Dataset" button for factory reset.
9. **Settings & Thresholds**:
   - Campus name and utility tariff (default RM 2.85 / m³).
   - Configurable detection thresholds for Rules A, B, and C.
   - Interactive priority weight sliders (enforces 100% total).
   - "Rerun Detection Engine" button: Re-evaluates entire dataset against updated parameters with real-time toast feedback.

---

## ⚙️ Detection Rules

### Rule A: Unexpected Consumption Spike
Flags hourly readings exceeding the diurnal expected baseline by a configurable percentage threshold and absolute minimum excess:
$$\text{Actual} \ge \text{Expected} \times \left(\frac{\text{SpikeThreshold}\%}{100}\right) \quad \text{AND} \quad (\text{Actual} - \text{Expected}) \ge \text{MinExcessLitres}$$
*Defaults: $\ge 200\%$ of baseline and $\ge 150\text{ L/hr}$ excess.*

### Rule B: Continuous Overnight Flow
Detects continuous, non-zero flow sustained during low-occupancy hours ($01:00 - 05:00$):
$$\text{Count of consecutive hours with Flow} \ge \text{OvernightThreshold} \quad (\ge \text{MinHours})$$
*Defaults: $\ge 3$ consecutive hours $\ge 80\text{ L/hr}$ between $01:00$ and $05:00$. Reduces false positives from single nighttime flushes.*

### Rule C: Repeated Unusual Nighttime Usage
Compares night hours across consecutive nights against historical nighttime baselines:
$$\text{Night Flow}_{\text{Day } N} \ge 150\% \times \text{Night Flow}_{\text{Baseline}} \quad \text{across } 2+ \text{ consecutive nights}$$

---

## 🎯 Smart Priority Scoring Formula

The priority score ($S \in [1, 100]$) is computed using normalized inputs:

$$S = \min\left(100, \max\left(1, \text{round}\left(w_1 \cdot E + w_2 \cdot P + w_3 \cdot V + w_4 \cdot C\right)\right)\right)$$

Where:
- $E \in [0, 100]$: Normalized daily excess volume ($\min\left(100, \frac{\text{Daily Excess}}{8000} \times 100\right)$)
- $P \in [0, 100]$: Persistence & frequency score based on duration and repeat occurrences
- $V \in \{25, 50, 75, 100\}$: Pattern severity (Low=25, Medium=50, High=75, Critical=100)
- $C \in \{35, 65, 100\}$: Telemetry evidence strength (Preliminary=35, Moderate=65, High=100)
- Weights: $w_1 = 0.35$, $w_2 = 0.25$, $w_3 = 0.20$, $w_4 = 0.20$ ($\sum w_i = 1.0$)

---

## 🧪 Included Campus Scenarios

| Scenario | Facility | Behavior & Lifecycle |
|---|---|---|
| **Scenario A** | `BLD-102` Kolej Kediaman 5 (Hostel Block C) | **Persistent Overnight Flow**: Hairline underground distribution crack causing continuous 155–185 L/hr flow during 01:00–05:00. Priority: 88 (Critical). |
| **Scenario B** | `BLD-106` Biotech Research Annex | **Sudden Spike**: Rooftop cooling tower make-up float valve stuck open, spiking to 1,320 L/hr (+400%). Priority: 84 (Critical). |
| **Scenario C** | `BLD-109` Aquatic Sports Complex & Pool | **Repeated Nighttime Anomaly**: Surge balance tank bypass valve leaking on 3 consecutive nights. Priority: 72 (High). |
| **Scenario D** | `BLD-101`, `BLD-104`, `BLD-107`, `BLD-108` | **Normal Baseline**: Predictable diurnal curves matching occupancy; zero false alerts. |
| **Scenario E** | `BLD-103` Faculty of Engineering Block E | **Repair Success & Verification**: 8 leaking toilet cisterns repaired on Day 10. Flow dropped from 445 L/hr to 135 L/hr (-70%). Verified saving: 7,440 L/day (~RM 21.20/day). |
| **Scenario F** | `BLD-112` Agricultural Greenhouse & Nursery | **False Positive**: 03:00 AM flow of 415 L/hr flagged by engine; investigated and verified as legitimate automated fertigation flush cycle. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- npm or pnpm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic unit test suite via CLI
node scripts/testEngine.js

# 3. Build production bundle (TypeScript compilation + Vite build)
npm run build

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🏆 System Verification Checklist

1. **Data Consistency**:
   Check `BLD-102` or `BLD-106` on the Overview Dashboard, Buildings view, Alerts table, and Inspection Queue. Reading values, excess volumes, priority scores, and alert explanations agree mathematically.
2. **Actionability**:
   - Acknowledge alerts and mark legitimate operations as False Positive with documented justification.
   - Dispatch new inspection tickets and assign technicians.
   - Record findings, log completed repairs, and verify telemetry.
   - Upload new meter readings via CSV and observe immediate chart and detection updates.
   - Rerun the detection engine with modified thresholds in Settings.
3. **Automated Diagnostic Suite**:
   Click **"System Diagnostics"** at the bottom of the left sidebar to execute all unit tests in real time in the browser.

---

*Aqua Sentinel — Universiti Malaya Hackathon Prototype*
