# 💧 Aqua Sentinel — Smart Water Leak Detection & Repair Platform

> **"Find leaks fast. Save water. Stop high bills."**

Welcome to **Aqua Sentinel**! This is a simple, smart web dashboard that helps a university campus (like Universiti Malaya) track water usage, spot hidden leaks, and send plumbers to fix pipes before thousands of litres go down the drain.

---

## 🧐 What Problem Does This Solve?

Think about an underground pipe crack or a broken toilet tank that constantly trickles water.
- Nobody sees it during the day.
- At night, when everyone is asleep, water is still gushing away.
- By the end of the month, the school gets a massive water bill, and thousands of litres of clean water are wasted.

**Aqua Sentinel fixes this!** It reads smart water meters across 20 campus buildings every hour. If water usage looks weird (like lots of water running at 3:00 AM), it rings an alarm, tells the maintenance crew which building needs help first, and checks if the leak really stopped after it's fixed.

---

## 👥 3 Simple Roles (Who Uses This?)

You can switch between 3 different perspectives anytime:

1. 🏢 **Facility Admin (The Campus Manager)**
   - Sees the big picture: all 20 buildings, total water used today, and active leak alerts.
   - Looks at a list of buildings sorted by urgency (1 to 100) so they know where to send plumbers first.
   - Dispatches repair tickets with one click.

2. 🔧 **Repair Worker (The Technician / Plumber)**
   - Opens the dashboard on their phone or tablet to see jobs assigned to them.
   - Visits the building, finds the problem (e.g. "broken cistern in 2nd floor bathroom"), and fixes it.
   - Types in what was replaced and marks the job as done.

3. 🏠 **Hostel Resident (The Student living in dorms)**
   - Sees if their hostel's water is healthy or has an ongoing repair.
   - Easily reports a leaking tap, shower, or toilet right from their phone.
   - Tracks whether their report was received and when a worker is coming.

---

## 🔍 How Does It Spot Leaks? (No Fancy Magic, Just Smart Math!)

Instead of guessing, the app uses 3 simple, common-sense rules:

### 1. 🚨 The Big Spike (Rule A)
- **What it means:** A building suddenly uses 2x or 3x more water in an hour than it usually does.
- **Example:** A cooling tower valve gets stuck wide open and floods 1,300 litres in one hour!

### 2. 🌙 The Midnight Runner (Rule B)
- **What it means:** Water keeps running non-stop between 1:00 AM and 5:00 AM.
- **Why it matters:** Almost nobody is awake flushing toilets at 3:30 AM! If water keeps running steadily for hours at night, there's almost certainly a leaking toilet flap or underground pipe crack.

### 3. 📉 The Priority Score (1 to 100)
If 5 different buildings have leaks, which one should the plumber visit first?
Aqua Sentinel gives each issue a score from **1 (Minor)** to **100 (Emergency)** based on:
- **How much water is being wasted** (40% weight — bigger leak = higher priority)
- **How long it has been leaking** (25% weight — continuous leaks damage walls)
- **How dangerous it is** (20% weight — Critical vs Low)
- **How sure the data is** (15% weight — multiple meter checks)

The highest score jumps straight to the top of the list!

---

## 🏫 Real Campus Scenarios Included

The app comes loaded with 20 real campus buildings and fun realistic scenarios:

| Building | What Happened? | The Result |
|---|---|---|
| **Kolej Kediaman 5 (Dorm C)** | Underground pipe cracked. Continuous 160 L/hr leak every night. | 🚨 Flagged as **Priority 88 (Critical)**. |
| **Biotech Research Lab** | Rooftop cooling valve got stuck open. | 🚨 Huge water spike to 1,320 L/hr. |
| **Faculty of Engineering (Block E)** | 8 leaky toilet tanks were repaired on Day 10. | ✅ Water dropped by 70%, saving **7,440 Litres/day** (RM 21/day saved)! |
| **Campus Greenhouse** | Sprinklers turned on at 3:00 AM automatically. | ℹ️ Flagged at first, then marked as **"Normal Routine" (False Positive)** so workers don't waste time driving there. |

---

## 💻 Tech Stack (What We Used to Build It)

- **React & Vite**: Super fast and modern website builder.
- **TypeScript**: Helps keep our code clean with zero errors.
- **Tailwind CSS**: Makes the UI look sleek, warm, and easy on the eyes.
- **Recharts**: Beautiful interactive charts to see hourly water curves.
- **Lucide Icons**: Crisp, clean icons for easy navigation.
- **Supabase**: Cloud database and user login system.

---

## 🚀 How to Run It on Your Computer

You only need **Node.js** installed on your computer.

### Step 1: Clone or open the folder
```bash
cd "easyparcel1"
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Run the test suite (Checks all leak math)
```bash
node scripts/testEngine.js
```
*(You will see: `ALL TESTS RESULT: ✓ 100% SUITE PASSED`)*

### Step 4: Start the web app
```bash
npm run dev
```

Now open your browser and go to:
👉 **`http://localhost:3000`**

---

## 🎮 Things You Can Try Out

1. **Pick a Role**: Click **Facility Admin**, **Repair Worker**, or **Resident** and log in (or use Instant Preview).
2. **Check the Dashboard**: Look at the top stats, the water trend graph, and active leak warnings.
3. **Dispatch a Plumber**: Click the **"+ Dispatch Inspection"** button to create a new repair ticket.
4. **Change the Time Filter**: Click **Today**, **7 Days**, or **30 Days** to watch the water chart update instantly.
5. **Report an Issue as a Resident**: Switch to the **Resident** role, type in your hostel room and what's leaking, and submit!

---

*Made with ❤️ for Universiti Malaya Water Sustainability.*
