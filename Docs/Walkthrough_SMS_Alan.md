# Walkthrough: SMS - Self Management System

We have enhanced and updated the application based on your feedback:
1. **Renamed to "SMS - Self Management System"**: Updated brand header, titles, and system metadata.
2. **Day 1 Default State**: Clean start on **Day 1 / 90** in **Phase 1: Priority & Discipline** with an initial streak of 0 days.
3. **Editable Focus Timer**: Allows setting custom minutes (1–180m), quick chips (`1m`, `5m`, `15m`, `20m`, `25m`), adjustment buttons (`-5m` / `+5m`), and synced duration with Step 1 (Plan).
4. **Editable Focus Schedule**: Fully customizable schedule in both **Weekly Review** and **Onboarding Step 2**, with the ability to edit days, times, durations, add new focus blocks (`+ Add Focus Block`), and remove blocks (`✕`).
5. **Beta Testing Skip Day & Jump Engine**: A dedicated testing toolkit in the top bar featuring `[ ⏭️ Skip Day (+1 Day) ]` and `[ Jump to Day: (1-90) ]` to quickly test phase transitions (Day 31 $\rightarrow$ Phase 2, Day 61 $\rightarrow$ Phase 3, Day 90 graduation), scoreboard resets, and streak mechanics.

---

## 1. Key New Features Implemented

### ⏱️ 1. Editable Focus Timer Controls
* Located on **Daily Loop - Step 2: Focus Timer**:
  * **Quick Select Chips:** `[ 1m ]`, `[ 5m ]`, `[ 15m ]`, `[ 20m ]`, `[ 25m ]`.
  * **Step Adjustments:** `[ -5m ]` and `[ +5m ]` to fine-tune study session duration.
  * **Custom Minute Input:** Type any number of minutes (1–180) and click `[Set]` to immediately reconfigure the timer.
  * **Plan Step Sync:** Entering duration on Step 1 (`daily-input-duration`) automatically propagates to the Focus Timer.

### 🗓️ 2. Editable Schedule Manager
* Located on **Weekly Review (Section 2)** and **Onboarding Step 2**:
  * **Interactive Block Editor:** Each row features an editable Day dropdown (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`, `Mon-Fri`), Time picker (e.g., `19:45`), and Duration input.
  * **Add Focus Blocks:** Click `+ Add Focus Block` to add new study slots.
  * **Delete Blocks:** Click `✕` on any row to remove that block.
  * All schedule modifications persist automatically to `localStorage`.

### ⏭️ 3. Beta Testing Skip Day & Jump Engine
* Located on the **Top Utility Bar**:
  * **`[ ⏭️ Skip Day (+1 Day) ]`:**
    * Increments the 90-day calendar by 1 day.
    * Automatically recalculates the behavioral phase:
      * **Days 1–30:** Phase 1: Priority & Discipline
      * **Days 31–60:** Phase 2: Habit + Grit (Triggers milestone celebration!)
      * **Days 61–90:** Phase 3: Mastery & Self-Learning (Triggers milestone celebration!)
      * **Day 90:** Graduation modal/toast.
    * Resets the daily loop and scoreboard for a clean test of the new day.
  * **`[ Jump to Day: (1-90) ]`:**
    * Jump directly to boundary days (e.g., Day 30, Day 31, Day 60, Day 61, Day 90) to test state transitions instantly.

### 🌱 4. Default Day 1 Starting State
* Fresh users or clicking `🌱 Reset to Day 1 (Default)` in the sidebar initializes:
  * `Day 1/90` | `Phase 1: Priority & Discipline`
  * `Streak: 0 days`
  * Clean 5-Skill Scoreboard (`0/1` for Priority, Discipline, Habit, Grit, Self-Learning)
  * Default 90-Day Goal ready for execution.

---

## 2. Automated Test Results

We expanded the automated test suite in `tests/test_behavioral_engine.js` and executed it via macOS JavaScriptCore (`jsc`):

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_behavioral_engine.js
```
* **Results: 29 Passed, 0 Failed**
  * `[PASS]` Default state starts on Day 1 (Phase 1: Priority & Discipline).
  * `[PASS]` Initial streak is 0 on Day 1.
  * `[PASS]` Scoreboard earning rules (BR-01).
  * `[PASS]` 24-Hour Safety Net & Anti-Guilt streak protection (BR-02 & ADR-003).
  * `[PASS]` Phase progression logic: Day 1–30 (Phase 1), Day 31–60 (Phase 2), Day 61–90 (Phase 3).
  * `[PASS]` Custom editable timer calculations (`1m -> 60s`, `5m -> 300s`, `20m -> 1200s`, clamp 0 $\rightarrow$ 1m, clamp 200 $\rightarrow$ 180m).
  * `[PASS]` Editable schedule management (adding and removing focus blocks).

DOM ID cross-check:
```bash
perl -ne '...' index.html
```
* **Results:** All UI element IDs accessed by `getElementById` in `js/app.js` matched 100% in `index.html`.

---

## 3. How to Beta

### 💻 Production Web Application & Backend (Option 2: Node.js + SQLite)
* 🖥️ **[`backend/server.js`](file:///Users/user/Documents/SMS_Alan/backend/server.js)**: Express REST API server implementing all endpoints from the design document (`/api/v1/...`).
* 💾 **[`backend/db.js`](file:///Users/user/Documents/SMS_Alan/backend/db.js)**: SQLite3 database layer with schema tables, migrations, and Day 1 seeding.
* 📦 **[`backend/sms_system.db`](file:///Users/user/Documents/SMS_Alan/backend/sms_system.db)**: Active relational database file.
* 🚀 **[`start.sh`](file:///Users/user/Documents/SMS_Alan/start.sh)**: Executable launch script running the backend on `http://localhost:3000`.
* 📡 **[`js/apiClient.js`](file:///Users/user/Documents/SMS_Alan/js/apiClient.js)**: Frontend API client syncing data with SQLite in real time.
* 🌐 **[`index.html`](file:///Users/user/Documents/SMS_Alan/index.html)**: Clean, single-page application structure implementing all 8 screens from the wireframes.
* 🎨 **[`css/styles.css`](file:///Users/user/Documents/SMS_Alan/css/styles.css)**: Canva-inspired stress-free pastel design system (Sky Blue `#70C8E2`, Pastel Coral `#FF8A8A`, Mint Green `#84E3A5`, Soft Purple `#CBB2FE`).
* 🧠 **[`js/models.js`](file:///Users/user/Documents/SMS_Alan/js/models.js)**: Data models, validation schemas, and Day 1 default state.
* 💾 **[`js/storage.js`](file:///Users/user/Documents/SMS_Alan/js/storage.js)**: Offline-first LocalStorage persistence engine with auto-save and draft recovery.
* ⏱️ **[`js/timerWorker.js`](file:///Users/user/Documents/SMS_Alan/js/timerWorker.js)**: Drift-free background countdown timer worker.
* 🔔 **[`js/audio.js`](file:///Users/user/Documents/SMS_Alan/js/audio.js)**: Synthetic dual-tone harmonic chime via Web Audio API.
* 🎮 **[`js/app.js`](file:///Users/user/Documents/SMS_Alan/js/app.js)**: Main application controller managing tab routing, daily loop stepper, timer controls, 5-skill scoreboard calculations, and 24h safety net logic.
* 🏷️ **[`src/types/index.ts`](file:///Users/user/Documents/SMS_Alan/src/types/index.ts)**: Full TypeScript domain definitions matching the relational database schema.

1. Open [`index.html`](file:///Users/user/Documents/SMS_Alan/index.html) in your browser (Safari, Chrome, or Edge).
2. **Test the Editable Timer:**
   * Go to **Daily Loop** $\rightarrow$ **2. Focus Timer**.
   * Click `1m` or `5m` or click `+5m` / `-5m`, or enter `2` in the custom input and click `Set`.
   * Click `[Start]` to verify the countdown and completion chime.
3. **Test the Editable Schedule:**
   * Go to **Weekly Review**.
   * Change a day or time, click `+ Add Focus Block` to add a new slot, or click `✕` to delete one.
   * Click `[Finalize Weekly Plan]`.
4. **Test Day Skipping & Phase Transitions:**
   * In the top bar, click `⏭️ Skip Day (+1 Day)`.
   * Type `30` in the "Jump to Day" box and click `Go`.
   * Click `⏭️ Skip Day (+1 Day)` again to advance to **Day 31** $\rightarrow$ Observe the milestone notification for **Phase 2: Habit + Grit**!
   * Jump to **Day 60** $\rightarrow$ Skip to **Day 61** $\rightarrow$ Observe **Phase 3: Mastery & Self-Learning**!
5. **Test the 24-Hour Safety Net:**
   * On Daily Loop Step 3 (End Day), click `[ SWITCH: CLOSED ]` to toggle it to `[ SWITCH: OPEN ]`.
   * Verify the Grit point is awarded and streak protection remains active.
