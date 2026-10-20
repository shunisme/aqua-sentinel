## Aqua Sentinel, a Smart Water Leak Detection & Repair Platform

Live demo: https://aqua-sentinel-pink.vercel.app/

Welcome to **Aqua Sentinel**! This is a simple and smart web dashboard that helps a university campus (like Universiti Malaya) track water usage, spot hidden leaks and send plumbers to fix pipes before a huge amount of water is wasted

---

## What Problem Does This Solve?

Think about an underground pipe crack or a broken toilet tank that constantly trickles water.
- No one sees it during the day.
- At night, when everyone is asleep, water is still gushing away.
- By the end of the month, the school gets a massive water bill, and thousands of litres of clean water are wasted.

**Aqua Sentinel fixes this!** It reads smart water meters across 20 campus buildings every hour. If water usage is abnormal (like lots of water running at 3:00 AM), it sends data and tells the maintenance crew which building needs help first and checks if the leak really stopped after it is fixed.

---

## Roles

You can switch between 3 different perspectives anytime:

1.  **Facility Admin 
   - Oversee the buildings, total water used today and active leak alerts.
   - Looks at a list of buildings sorted by urgency (1 to 100) so they know where to send plumbers first.
   - Dispatches repair tickets .

2.  **Repair Worker 
   - Visits the building and fix the problem.
   - Record what was replaced and marks the job as done.

3.  **Hostel Resident 
   - Sees if their hostel's water is healthy or has an ongoing repair.
   - Reports a leaking tap, shower, or toilet right from their phone.
   - Tracks whether their report was received and when a worker is coming.

---

## How Does It Spot Leaks?

Instead of guessing, the app uses 3 simple, common-sense rules:

### 1. The Spike
- **What it means:** A building suddenly uses 2x or 3x more water in an hour than it usually does.
- **Example:** A cooling tower valve gets stuck wide open and floods 1,300 litres in one hour!

### 2. The Priority Score (1 to 100)
If 5 different buildings have leaks, which one should the plumber visit first?
Aqua Sentinel gives each issue a score from **1 (Minor)** to **100 (Emergency)** based on:
- **How much water is being wasted** (40% weight — bigger leak = higher priority)
- **How long it has been leaking** (25% weight — continuous leaks damage walls)
- **How dangerous it is** (20% weight — Critical vs Low)
- **How sure the data is** (15% weight — multiple meter checks)

The highest score jumps straight to the top of the list!

---

## Tech Stack

- **React & Vite**
- **TypeScript**
- **Tailwind CSS**
- **Recharts**
- **Lucide Icons**
- **Supabase**

