# Implementation Plan: SMS - ALAN (Behavioral Operating System)

Building **SMS - ALAN** (Self-Management Skills Alan) based on the research presentation and wireframes from Vinschool GATE ([`BRD_SMS_Alan.md`](file:///Users/user/Documents/SMS_Alan/Docs/BRD_SMS_Alan.md), [`BA_Analysis_SMS_Alan.md`](file:///Users/user/Documents/SMS_Alan/Docs/BA_Analysis_SMS_Alan.md), [`Use_Cases_SMS_Alan.md`](file:///Users/user/Documents/SMS_Alan/Docs/Use_Cases_SMS_Alan.md), and [`Design_Document_SMS_Alan.md`](file:///Users/user/Documents/SMS_Alan/Docs/Design_Document_SMS_Alan.md)).

SMS - ALAN is a science-backed student productivity platform designed to break the **Binge $\rightarrow$ Fatigue $\rightarrow$ Missed Day $\rightarrow$ Guilt Spiral $\rightarrow$ Abandonment** cycle through a structured **90-Day Roadmap**, a frictionless **Daily Behavioral Loop** (Plan $\rightarrow$ Focus Timer $\rightarrow$ End Day), and a **24-Hour Safety Net**.

---

## User Review Required

> [!IMPORTANT]
> **Implementation Stack Recommendation:**
> To provide an immediately runnable, responsive, zero-setup application that matches the wireframes with pixel perfection, we propose building the application as a **Modern React + TypeScript + Vite + Tailwind CSS Single-Page Application (PWA)** with an **Offline-First Local Storage Engine**.
> 
> * **Why this stack:**
>   1. **Zero Database Configuration Required Locally:** Runs instantly in any modern browser via standard web standards.
>   2. **Drift-Free Timing:** Native Web Worker support for the countdown timer that never slows down or drifts when the tab is hidden or the phone locks.
>   3. **Canva Wireframe Fidelity:** Effortless styling using Tailwind CSS to implement the exact pastel stress-free color palette (Sky Blue `#70C8E2`, Coral `#FF8A8A`, Mint `#84E3A5`).
>   4. **Plug-and-Play Backend Migration:** Data models and storage adapters match the PostgreSQL schema and REST API contracts defined in [`Design_Document_SMS_Alan.md`](file:///Users/user/Documents/SMS_Alan/Docs/Design_Document_SMS_Alan.md) so a cloud backend (Supabase/Node.js or Bubble) can be connected seamlessly.

> [!NOTE]
> **Audio Chime:** The focus timer completion sound will use the browser's native Web Audio API (synthesizing a calming dual-tone bell chime) to avoid external audio file asset loading issues.

---

## Open Questions

> [!NOTE]
> 1. **Initial Demo State:** Should the application initialize directly into the **Onboarding Wizard (Step 1)** on first launch, or provide a "Load Sample Student Data" button (pre-filling Alan's English 9.0 $\rightarrow$ 9.5 journey at Day 42) so all screens can be immediately inspected?
>    * *Default proposal:* Onboarding starts by default, with a one-click *"Load Alan's Demo Data"* shortcut in the header/footer for testing.
> 2. **Multi-Language UI Support:** The wireframes feature Vietnamese translations for weekly key results (`Hoàn thành 3 bài kiểm tra nghe`) and schedule previews (`Lịch trình (Tự động)`). The UI will support bilingual text display out of the box.

---

## Proposed Changes

We will build the application in the workspace root (`/Users/user/Documents/SMS_Alan`), structured as follows:

```
/Users/user/Documents/SMS_Alan/
├── Docs/                               # Requirements & Specifications
│   ├── BRD_SMS_Alan.md
│   ├── BA_Analysis_SMS_Alan.md
│   ├── Use_Cases_SMS_Alan.md
│   ├── Design_Document_SMS_Alan.md
│   ├── Implementation_Plan_SMS_Alan.md
│   └── README.md
├── index.html                          # HTML5 Entry point
├── package.json                        # Vite, React 18, TypeScript, Tailwind, Lucide
├── tsconfig.json                       # TypeScript compiler options
├── vite.config.ts                      # Vite build configuration
├── tailwind.config.js                  # Custom pastel palette & styling tokens
├── postcss.config.js                   # PostCSS plugin config
└── src/
    ├── main.tsx                        # React application bootstrap
    ├── App.tsx                         # Main Router / Shell & Active View manager
    ├── index.css                       # Global styles & font styling
    ├── types/                          # TypeScript interfaces matching DB models
    │   └── index.ts
    ├── services/                       # Storage & Worker services
    │   ├── storageService.ts           # Offline-first repository (LocalStorage)
    │   └── audioService.ts             # Web Audio chime generator
    ├── context/                        # Global State Engine
    │   └── AppContext.tsx              # 90-day progress, daily loop, scoreboard, streak
    ├── components/
    │   ├── common/                     # Reusable UI widgets
    │   │   ├── Sidebar.tsx             # Navigation: Dashboard, Goals, Daily Loop, Weekly
    │   │   ├── ScoreboardBadge.tsx     # 5-Skill live score indicators
    │   │   └── Modal.tsx               # Encouraging modals (NGU / Milestones)
    │   ├── onboarding/                 # 3-Step Foundation Wizard
    │   │   ├── OnboardingStep1Goals.tsx
    │   │   ├── OnboardingStep2Time.tsx
    │   │   └── OnboardingStep3Habit.tsx
    │   ├── dashboard/                  # Control Center (Screen 4)
    │   │   ├── DashboardView.tsx
    │   │   └── MilestoneBanner.tsx
    │   ├── daily-loop/                 # The 3-Step Daily Routine (Screens 5-7)
    │   │   ├── DailyLoopContainer.tsx  # Sub-stepper header (1. Plan -> 2. Timer -> 3. End)
    │   │   ├── Step1PlanView.tsx       # Top-1, If-Then Shield, 2m habit checklist
    │   │   ├── Step2TimerView.tsx      # Web worker countdown timer & 1-sentence wrap-up
    │   │   └── Step3EndDayView.tsx     # 3 prompts, 24h Safety Net Switch, Streak
    │   └── weekly/                     # Weekly Review (Screen 8)
    │       └── WeeklyReviewView.tsx    # 3 OKRs, Schedule view, deliberate practice focus
    └── workers/
        └── timerWorker.ts              # Drift-free background web worker timer
```

---

## Verification Plan

### Automated Tests & Quality Checks
1. **Type & Build Verification:**
   * Run `npm run build` / TypeScript compiler check to verify zero syntax, lint, or type errors.
2. **Logic & State Verification:**
   * Scoreboard point calculation (verifying all 5 skills calculate 0/1 correctly).
   * 24h Safety Net streak retention (verifying streak does not reset if safety net switch is open).
   * Timer delta accuracy (verifying timer completes in exact target seconds).

### Manual Verification
1. **Full Onboarding Walkthrough:**
   * Enter Goal details (English 9.0 $\rightarrow$ 9.5) $\rightarrow$ Time Allocation (19:45, 20m) $\rightarrow$ Habit Loop $\rightarrow$ Verify redirect to Dashboard.
2. **Daily Loop Execution Walkthrough:**
   * Complete Step 1: Check 2-min habit, input If-Then shield $\rightarrow$ Click `[Start Focus]`.
   * Complete Step 2: Run Focus Timer $\rightarrow$ Enter 1-sentence summary $\rightarrow$ Click `[Finish Focus]`.
   * Complete Step 3: Fill 3 reflection prompts $\rightarrow$ Click `[Save & Finish]` $\rightarrow$ Verify Scoreboard displays 5/5 and streak increments.
3. **24-Hour Safety Net Slip & Recovery Walkthrough:**
   * Simulate a missed day $\rightarrow$ Navigate to Step 3 $\rightarrow$ Toggle `(Reset 24h)` to `OPEN` $\rightarrow$ Select reason `exhausted` and micro-action `2 mins` $\rightarrow$ Submit $\rightarrow$ Verify streak remains intact and Grit point is awarded.
4. **Weekly Review Walkthrough:**
   * Navigate to Weekly Review $\rightarrow$ Edit 3 Key Results and Deliberate Practice method $\rightarrow$ Click `[Finalize Weekly Plan]`.
5. **Cross-Device Responsiveness:**
   * Verify layout on mobile viewport ($375\text{px}$ width) and desktop viewport ($1280\text{px}$ width).
