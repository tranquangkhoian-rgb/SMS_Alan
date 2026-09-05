# SMS - Self Management System

Welcome to the official repository for **SMS - Self Management System** (formerly SMS - ALAN), originated by **Trần Quang Khôi An** at the **Vinschool Gifted and Talented Education Center (GATE)**.

---

## 🚀 Quick Start: Launch the Application & Backend

The system now includes a full **Node.js + Express REST API Backend with SQLite3 Database**:

* **Start Backend & Web App (Recommended):**
  ```bash
  cd /Users/user/Documents/SMS_Alan
  ./start.sh
  ```
  Then open your browser to **`http://localhost:3000`**.
  * The frontend will show: **`🟢 Backend: SQLite3 Online`**.
  * All 90-day progress, timer sessions, reflections, scoreboard points, and streaks are persisted directly in `backend/sms_system.db`.

* **Or Direct Browser Launch (Offline Mode):**  
  Double-click [`index.html`](file:///Users/user/Documents/SMS_Alan/index.html) in Safari, Chrome, Edge, or Firefox. It will automatically connect to `http://localhost:3000` if running, or use LocalStorage if offline.

---

## 🎯 Key Beta Testing & Customization Features

1. **Default Day 1 Start:**
   * App initializes on **Day 1 / 90** in **Phase 1: Priority & Discipline** with a streak of 0 days.
2. **Beta Testing Skip Day Engine:**
   * **`[ ⏭️ Skip Day (+1 Day) ]` Button:** Instantly advance the 90-day calendar one day at a time.
   * **`[ Jump to Day: (1-90) ]` Selector:** Fast-forward directly to Day 31 (Phase 2: Habit + Grit), Day 61 (Phase 3: Mastery & Self-Learning), or Day 90 (Graduation) to test milestone unlocks, scoreboard resets, and streak behaviors.
3. **Custom Editable Focus Timer:**
   * Quick chips: `[ 1m ]`, `[ 5m ]`, `[ 15m ]`, `[ 20m ]`, `[ 25m ]`.
   * Dynamic adjust buttons: `[ -5m ]` and `[ +5m ]`.
   * Custom minutes input box: Enter any duration (1–180 minutes) and click `[Set]`.
   * Automatic synchronization with Step 1 (Plan) and session parameters.
4. **Custom Editable Schedule Management:**
   * Interactive schedule editor in both **Weekly Review** and **Onboarding Step 2**.
   * Customize day of the week, start time, and duration for each focus block.
   * Add new focus blocks (`+ Add Focus Block`) or delete existing blocks (`✕`).
5. **24-Hour Safety Net (Anti-Guilt Protocol):**
   * Toggle `[ SWITCH: OPEN / CLOSED ]` to test streak preservation and Grit score allocation.

---

## 📚 Complete Documentation Suite

1. 📄 **[BRD_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/BRD_SMS_Alan.md)** — **Business Requirements Document**
   * Problem discovery & root causes (overwhelm, binge-study, guilt spiral, static list failures).
   * 8-Pillar scientific foundation (Pippa Lally UCL, Ericsson, Wright, Draganski, Prochaska & DiClemente, Wood & Neal, Gollwitzer, Clear).
   * 5-Core behavioral competencies (Priority, Discipline, Habit, Grit NGU, Self-Learning).

2. ⚙️ **[BA_Analysis_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/BA_Analysis_SMS_Alan.md)** — **Business Analysis & System Specifications**
   * As-Is vs. To-Be process workflows.
   * Conceptual Data Model & Entity-Relationship Diagram (ERD).
   * Detailed Functional Requirements for Onboarding (Steps 1–3), Dashboard, Daily Loop (Steps 1–3), Scoreboard, 24h Safety Net, and Weekly Review.

3. 📋 **[Use_Cases_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/Use_Cases_SMS_Alan.md)** — **Detailed Use Case Specifications**
   * 10 formal Cockburn-style Use Case specifications with step-by-step main flows, alternative flows, and wireframe mapping.

4. 📐 **[Design_Document_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/Design_Document_SMS_Alan.md)** — **Technical Design Document (TDD)**
   * C4 Container Architecture, sequence diagrams, PostgreSQL 16 DDL schema, RESTful OpenAPI 3.1 contracts, and 5 Architecture Decision Records (ADRs).

5. 🛠️ **[Implementation_Plan_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/Implementation_Plan_SMS_Alan.md)** — **Technical Implementation Plan**
   * Phased development roadmap, automated verification plan, and technical stack decisions.

6. 🎯 **[Walkthrough_SMS_Alan.md](file:///Users/user/Documents/SMS_Alan/Docs/Walkthrough_SMS_Alan.md)** — **Engineering Walkthrough & Test Report**
   * Verification results (29 automated tests passed, 72 DOM IDs verified), feature highlights, and user flow guides.

---

## 💻 Source Code Architecture

```
/Users/user/Documents/SMS_Alan/
├── index.html                   # Single-Page Application Entry Point
├── css/
│   └── styles.css               # Canva Wireframe Stress-Free Pastel Styles
├── js/
│   ├── app.js                   # Application Controller & Router
│   ├── models.js                # Data Models & Day 1 Default State
│   ├── storage.js               # Offline-First LocalStorage Repository (v2)
│   ├── audio.js                 # Web Audio API Synthetic Chime
│   └── timerWorker.js           # Drift-Free Web Worker Countdown Timer
├── src/types/
│   └── index.ts                 # Production TypeScript Interfaces (DB Schema Parity)
└── tests/
    ├── test_behavioral_engine.js # Automated Unit Tests (29 tests, 0 failures)
    └── test_dom_integrity.js    # UI Integrity Verification (72 IDs checked)
```
