# Use Case Specifications (User Cases)
## Project Name: SMS - ALAN (Self-Management Skills Alan)
**Version:** 1.0  
**Date:** September 2026  
**Document Type:** Detailed Use Case Specifications  
**Based on:** Research Slides & Wireframes (Vinschool GATE)  

---

## 1. Use Case Catalog

| Use Case ID | Use Case Name | Primary Actor | Wireframe Screen Reference |
| :--- | :--- | :--- | :--- |
| **UC-01** | Student Onboarding: Set 90-Day Goal & Motivation | Student | Screen 1: Onboarding (Step 1/3) - Set up Goals |
| **UC-02** | Student Onboarding: Allocate Daily Free Time & Auto-Schedule | Student | Screen 2: Onboarding (Step 2/3) - Time Allocation |
| **UC-03** | Student Onboarding: Build 2-Minute Habit Loop | Student | Screen 3: Onboarding (Step 3/3) - Build a Habit |
| **UC-04** | View Dashboard & 90-Day Roadmap Progress | Student | Screen 4: Dashboard |
| **UC-05** | Daily Loop: Execute Step 1 - Plan & If-Then Shield | Student | Screen 5: Daily - 1. Plan |
| **UC-06** | Daily Loop: Execute Step 2 - Focus Timer & Micro-Log | Student | Screen 6: Daily - 2. Focus Timer |
| **UC-07** | Daily Loop: Execute Step 3 - End Day 3-Prompt Reflection | Student | Screen 7: Daily - 3. End Day |
| **UC-08** | Activate 24-Hour Safety Net (Grit Reset Switch) | Student | Screen 7: Daily - 3. End Day |
| **UC-09** | Conduct Weekly Review & Deliberate Practice Planning | Student | Screen 8: Weekly |
| **UC-10** | Track Behavioral Scoreboard & Milestone Advancement | Student | Screens 4, 7 |

---

## 2. Detailed Use Case Specifications

---

### UC-01: Student Onboarding: Set 90-Day Goal & Motivation

* **Use Case ID:** UC-01
* **Primary Actor:** Student (e.g., High School Student)
* **Trigger:** Student launches SMS - ALAN for the first time or initiates a new 90-day cycle.
* **Preconditions:**
  1. Student has created an account or accessed the application.
  2. No active 90-day cycle is in progress.
* **Postconditions:**
  * **Success:** 90-day goal, baseline, target score, and emotional motivation are validated and stored. User proceeds to Step 2.
  * **Failure:** Form remains on Step 1 with highlighted missing/invalid fields.
* **Wireframe Mapping:** Screen 1 (`Docs/SMS-Alan - Wireframes.pdf`, Page 1 / Slide 22).

#### Main Success Scenario:
1. System presents the **"1. Onboarding (Step 1/3) - Set up Goals"** screen.
2. Student enters high-level statement in `90-day goal` (e.g., *"Students learn repeatedly every day and upgrade English score from 9 to 9.5 and talk more confidently"*).
3. Student selects or enters the academic `Subject` (e.g., *"English"*).
4. Student enters their current benchmark in `Right now:` (e.g., `9`).
5. Student enters their target benchmark in `Goal:` (e.g., `9.5`).
6. Student answers the metacognitive question `Why did you choose this goal?` with their intrinsic motivation (e.g., *"Because I want to talk more confidently and show excellent academic results for future exams"*).
7. Student clicks `[Next]`.
8. System validates inputs and transitions to Onboarding Step 2/3.

#### Alternative Flows:
* **AF-1.1 (Non-Numeric Goal):** If the academic subject evaluates performance qualitatively (e.g., "Pass IELTS Band 7.5"), the system accepts alphanumeric strings for `Right now` and `Goal`.

#### Business Rules:
* Target goal must represent measurable advancement over the baseline score.
* The emotional motivation must be non-empty (at least 15 characters) to ensure genuine intrinsic anchor.

---

### UC-02: Student Onboarding: Allocate Daily Free Time & Auto-Schedule

* **Use Case ID:** UC-02
* **Primary Actor:** Student
* **Trigger:** Successful completion of UC-01.
* **Preconditions:** Step 1 goal parameters have been stored in temporary state.
* **Postconditions:**
  * **Success:** Daily focus timebox confirmed; automated weekly schedule generated; student advances to Step 3.
  * **Failure:** User prompted to enter valid time ranges within 20–25 minute constraint.
* **Wireframe Mapping:** Screen 2 (`Docs/SMS-Alan - Wireframes.pdf`, Page 2 / Slide 23).

#### Main Success Scenario:
1. System displays **"2. Onboarding (Step 2/3) - Time Allocation"**.
2. Student defines their realistic available bandwidth in `Daily Free Time` (e.g., `30 mins / day`).
3. Student selects their `Priority Focus Time Slot` (e.g., `19:45`).
4. System automatically restricts or pre-fills `Duration` to the scientifically recommended 20–25 minute window (e.g., `20 - 25 minutes`).
5. System displays the dynamic **Preview Schedule (Auto-Generated / Tự động)**:
   * *Mon – Fri:* `19:45 (20m)`
   * *Sat:* `09:30 (25m)`
6. Student reviews the auto-schedule.
7. Student clicks `[Next]`.
8. System transitions to Onboarding Step 3/3.

#### Alternative Flows:
* **AF-2.1 (Back Navigation):** Student clicks `[Back]`. System preserves all entries and returns to Step 1/3.
* **AF-2.2 (Schedule Adjustment):** Student clicks on a specific day in the preview to tweak start times by $\pm 15\text{ minutes}$.

#### Business Rules:
* Default focus blocks must not exceed 25 minutes to protect against mental fatigue (based on Pomodoro and cognitive load research).
* Free time input must be $\ge$ focus block duration.

---

### UC-03: Student Onboarding: Build 2-Minute Habit Loop

* **Use Case ID:** UC-03
* **Primary Actor:** Student
* **Trigger:** Successful completion of UC-02.
* **Preconditions:** Steps 1 and 2 completed.
* **Postconditions:**
  * **Success:** Habit cue, micro-routine, and immediate reward are committed to database. System initializes Day 1 of the 90-Day Roadmap and navigates to the Dashboard.
* **Wireframe Mapping:** Screen 3 (`Docs/SMS-Alan - Wireframes.pdf`, Page 3 / Slide 24).

#### Main Success Scenario:
1. System displays **"3. Onboarding (Step 3/3) - Build a Habit"**.
2. Student specifies **1. Habit Cue** (Trigger connected to existing routine, e.g., *"After school..."*).
3. Student specifies **2. Minute Routine (Routine: 2 min)** (Micro-action, e.g., *"Sit at my desk and learn 5 new English words"*).
4. Student specifies **3. Immediate Reward** (Dopamine reinforcement, e.g., *"Stick a sticker and listen to my favorite song"*).
5. Student clicks `[Finish]`.
6. System activates 90-Day Roadmap (Day 1, Phase 1) and navigates student directly to the **Dashboard**.

#### Alternative Flows:
* **AF-3.1 (Back Navigation):** Student clicks `[Back]`. System returns to Step 2/3 preserving inputs.

#### Business Rules:
* Routine must follow the "2-minute rule" (extremely low activation energy).
* Reward must be immediate upon completion rather than deferred.

---

### UC-04: View Dashboard & Monitor 90-Day Behavioral Progression

* **Use Case ID:** UC-04
* **Primary Actor:** Student
* **Trigger:** User opens app or clicks `Dashboard` in the sidebar navigation.
* **Preconditions:** Onboarding is completed and a 90-day program is active.
* **Postconditions:** Current daily status, roadmap phase, and scoreboard points are rendered cleanly.
* **Wireframe Mapping:** Screen 4 (`Docs/SMS-Alan - Wireframes.pdf`, Page 4 / Slide 25).

#### Main Success Scenario:
1. System renders sidebar navigation (`Dashboard`, `Goals`, `Daily Loop`, `Weekly Review`).
2. System highlights `Dashboard`.
3. System displays the **90-Day Program Banner**:
   * Current Day: `Day X/90` (e.g., `Day 42/90`).
   * Current Phase: `Phase 2 (Days 31-60): Habit + Grit`.
4. System displays **Today's Main Task (Top-1)**:
   * Task Title: e.g., *"Finish English homework and review 5 vocabulary words"*.
   * Scheduled Focus Window: e.g., *"19:45 (20 mins)"*.
5. System renders the **Scoreboard (5 Skills)** with real-time status:
   * `Priority: 0/1` | `Discipline: 0/1` | `Habit: 0/1` | `Grit (Reset): 0/1` | `Self-learning: 0/1`.
6. System presents two primary action buttons:
   * `[Plan]`: Navigates to Daily Loop Step 1.
   * `[Start Focus]`: Navigates directly to Focus Timer (Step 2).

#### Alternative Flows:
* **AF-4.1 (All Skills Completed):** If student has finished the full loop for today, scoreboard displays `1/1` for completed skills and a checkmark badge is shown.

---

### UC-05: Daily Loop: Execute Step 1 - Plan & If-Then Shield

* **Use Case ID:** UC-05
* **Primary Actor:** Student
* **Trigger:** Student clicks `[Plan]` from Dashboard or navigates to `Daily Loop` in sidebar.
* **Preconditions:** Student is logged in and active on current calendar day.
* **Postconditions:**
  * **Success:** Daily plan, If-Then rule, and 2-minute habit checklist confirmed; Priority & Discipline scoreboard points unlocked; student proceeds to Focus Timer.
* **Wireframe Mapping:** Screen 5 (`Docs/SMS-Alan - Wireframes.pdf`, Page 5 / Slide 26).

#### Main Success Scenario:
1. System renders Daily Loop sub-stepper: `1. Plan` (active) $\rightarrow$ `2. Focus Timer` $\rightarrow$ `3. End day`.
2. System displays section **1. Top-1 + Timebox Objectives**:
   * Pre-fills or allows editing of target task: *"Learn 5 new English words"*.
   * Shows `Start at: 19:50` and `Duration: 20 mins`.
3. System displays section **2. If-Then** (Implementation Intentions):
   * `IF:` *"want to use phone"*.
   * `THEN:` *"Put phone out of reach"*.
4. System displays section **3. 2 Minutes Habit (Minimum)**:
   * Visual micro-chain: `Take A Bath` $\rightarrow$ `Learn 5 vocabulary words` $\rightarrow$ `Listen to Music`.
   * Checkbox: `[ ] Have completed minimum habit`.
5. Student performs the 2-minute starter habit and checks the box: `[x] Have completed minimum habit`.
6. Student clicks `[Start Focus]`.
7. System records Priority score (1/1) and Discipline score (1/1), and opens Step 2 (Focus Timer).

#### Alternative Flows:
* **AF-5.1 (Skip Planning to Timer):** If student previously filled planning details, clicking `[Start Focus]` transitions immediately without re-prompting.

#### Business Rules:
* Only ONE Top-1 task is permitted per day (enforces ruthless prioritization).
* Checking the 2-minute habit checkbox is required to earn the Discipline skill point.

---

### UC-06: Daily Loop: Execute Step 2 - Focus Timer & Micro-Log

* **Use Case ID:** UC-06
* **Primary Actor:** Student
* **Trigger:** Click `[Start Focus]` from Step 1 or Dashboard.
* **Preconditions:** Top-1 task defined.
* **Postconditions:**
  * **Success:** Focus timer executed; 1-sentence synthesis and next step logged; Habit score updated; student proceeds to Step 3.
* **Wireframe Mapping:** Screen 6 (`Docs/SMS-Alan - Wireframes.pdf`, Page 6 / Slide 27).

#### Main Success Scenario:
1. System renders Daily Loop sub-stepper with `2. Focus Timer` highlighted.
2. System displays session parameters:
   * `Completed English homework | Start: 19:45 | Goal: 20 min`.
3. System displays countdown clock initialized to `20:00`.
4. Student clicks `[Start]`.
5. Timer counts down from `20:00` toward `00:00`.
6. Upon countdown completion (or upon finishing work), timer notifies student with a soft chime.
7. Student inputs post-session synthesis:
   * `Done (Summary in 1 sentence):` e.g., *"Have completed the lesson, learned 5 new words"*.
   * `Next step:` e.g., *"Next morning, practiced back these 5 words"*.
8. Student clicks `[Finish Focus]`.
9. System awards the `Habit` point (1/1) and transitions to Step 3 (End Day).

#### Alternative Flows:
* **AF-6.1 (Timer Pause & Resume):** Student clicks `[Pause]` during session. Timer halts until student clicks `[Resume]`.
* **AF-6.2 (Timer Reset):** Student clicks `[Reset]`. Timer returns to `20:00`.

#### Business Rules:
* The 1-sentence summary encourages immediate cognitive consolidation (Anders Ericsson feedback loop).
* Timer must maintain accuracy across background tab switches.

---

### UC-07: Daily Loop: Execute Step 3 - End Day 3-Prompt Reflection

* **Use Case ID:** UC-07
* **Primary Actor:** Student
* **Trigger:** Click `[Finish Focus]` from Step 2, or evening reminder notification.
* **Preconditions:** Daily study session has been executed or attempted.
* **Postconditions:**
  * **Success:** 3 reflection answers stored; Self-Learning score awarded (1/1); daily streak incremented; loop closed.
* **Wireframe Mapping:** Screen 7 (`Docs/SMS-Alan - Wireframes.pdf`, Page 7 / Slide 28).

#### Main Success Scenario:
1. System renders Daily Loop sub-stepper with `3. End day` highlighted.
2. System displays **Scoreboard Recap** reflecting progress achieved so far (e.g., `Priority: 1/1 | Discipline: 1/1 | Habit: 1/1 | Grit (Reset): 0/1 | Self-learning: 0/1`).
3. Student completes the **Reflection (3 prompts)**:
   * `1) Intended outcome:` e.g., *"Master the grammar of present tense"*.
   * `2) What happened:` e.g., *"Still a few mistakes when conjugating singular verbs"*.
   * `3) One tweak for tomorrow:` e.g., *"Read the subject carefully before filling in the answer"*.
4. System confirms `(Reset 24h)` switch remains `[SWITCH: CLOSED]`.
5. System displays updated streak count: `Streak: X days` (e.g., `Streak: 3 days`).
6. Student clicks `[Save & Finish]`.
7. System awards `Self-learning: 1/1`, increments streak, and redirects to Dashboard.

#### Alternative Flows:
* **AF-7.1 (Study Session Missed / Fatigue):** Student missed focus session or struggled $\rightarrow$ Student executes **UC-08 (Activate 24-Hour Safety Net)**.

#### Business Rules:
* All 3 prompts must be answered to award the `Self-Learning` skill point.
* Reflections are saved to student's personal learning log for weekly review.

---

### UC-08: Activate 24-Hour Safety Net (Grit Reset Switch)

* **Use Case ID:** UC-08
* **Primary Actor:** Student
* **Trigger:** Student missed scheduled focus window or felt too exhausted to complete regular study block.
* **Preconditions:** Focus session was not completed on the scheduled day. Current time is within 24 hours of scheduled timebox.
* **Postconditions:**
  * **Success:** 24h reset logged; streak is protected and NOT reset to 0; Grit (Reset) point awarded (1/1); tomorrow's minimum 2-minute commitment registered.
* **Wireframe Mapping:** Screen 7 (`Docs/SMS-Alan - Wireframes.pdf`, Page 7 / Slide 28).

#### Main Success Scenario:
1. On the `Daily - 3. End Day` screen, student observes incomplete session.
2. Student clicks toggle `(Reset 24h):` to **`[SWITCH: OPEN]`**.
3. System expands the Safety Net fields:
   * `Reason:` Student selects/types reason (e.g., *"exhausted"*, *"school exam cramming"*).
   * `Action to fix mistake tomorrow:` Student inputs micro-commitment (e.g., *"Only do homework for minimum of 2 mins"*).
4. System validates that the proposed action adheres to the 2-minute micro-habit rule.
5. System displays confirmation: *"Streak Protected! Tomorrow's goal is locked at 2 minutes to get you back in momentum."*
6. Scoreboard marks `Grit (Reset): 1/1`.
7. Student clicks `[Save & Finish]`.
8. System updates streak count without penalty.

#### Alternative Flows:
* **AF-8.1 (Safety Net Expired > 24h):** If student does not engage with the app for > 48 consecutive hours, the Safety Net window expires. The streak resets to 0 with an encouraging prompt: *"Every master restarts. Let's do a 2-minute session right now!"*

#### Business Rules:
* The 24h Safety Net directly counters the "all-or-nothing" guilt cycle documented in the research slides.
* Awarding the Grit score reinforces psychological resilience (NGU - Never Give Up).

---

### UC-09: Conduct Weekly Review & Deliberate Practice Planning

* **Use Case ID:** UC-09
* **Primary Actor:** Student
* **Trigger:** Student clicks `Weekly Review` in sidebar navigation (typically on Sunday or start of week).
* **Preconditions:** At least 1 day of Daily Loop data exists for the current week.
* **Postconditions:**
  * **Success:** 3 weekly OKRs established; calendar focus blocks committed; deliberate practice technique logged.
* **Wireframe Mapping:** Screen 8 (`Docs/SMS-Alan - Wireframes.pdf`, Page 8 / Slide 29).

#### Main Success Scenario:
1. System renders **"8. Weekly"** review view.
2. System reinforces overarching **90-DAY OBJECTIVE**:
   * *"Study regularly every day and improve your English score from 9.0 to 9.5"*.
3. Student defines/updates **1. Expected Outcomes (3 Key Results)**:
   * `Result 1:` *"Complete 3 English listening tests (Hoàn thành 3 bài kiểm tra nghe)"*.
   * `Result 2:` *"Master 3 advanced vocabulary words daily (Làm chủ 3 từ vựng nâng cao mỗi ngày)"*.
   * `Result 3:` *"Practice speaking for 15 minutes every morning (Luyện nói 15 phút mỗi sáng)"*.
4. Student confirms **2. Priority Focus Blocks (Schedule)**:
   * *Tue:* `19:45 (20 mins)`
   * *Thu:* `19:45 (20 mins)`
   * *Sat:* `09:30 (25 mins)`
5. Student configures **3. Deliberate Practice Focus**:
   * Inputs specific feedback-driven practice method (e.g., *"Pronunciation: Record my voice and compare it with native speakers to fix ending sounds"*).
6. Student clicks `[Finalize Weekly Plan]`.
7. System locks weekly plan and schedules automated notifications for the specified focus blocks.

#### Business Rules:
* Exactly 3 Key Results are required to maintain clarity and focus.
* Deliberate practice must target an isolated weak point with clear self-feedback (Anders Ericsson research).

---

### UC-10: Track Behavioral Scoreboard & Milestone Advancement

* **Use Case ID:** UC-10
* **Primary Actor:** Student
* **Trigger:** Completion of daily cycles or reaching 30-day milestone boundaries.
* **Preconditions:** Student is actively logging daily activity.
* **Postconditions:** Cumulative stats updated; phase transitions unlocked at Days 31 and 61.
* **Wireframe Mapping:** Screens 4, 7.

#### Main Success Scenario:
1. System tallies daily scores across the 5 dimensions:
   * $\text{Total Score} = \text{Priority} + \text{Discipline} + \text{Habit} + \text{Grit} + \text{Self-Learning}$ (Max 5 pts/day).
2. When Day counter reaches Day 31:
   * System transitions student from *Phase 1 (Priority & Discipline)* to *Phase 2 (Habit + Grit)*.
   * System presents celebratory milestone modal explaining the shift toward grit and habit automaticity (Pippa Lally research).
3. When Day counter reaches Day 61:
   * System transitions student to *Phase 3 (Mastery & Self-Learning)*.
4. When Day 90 is completed:
   * System prompts final retrospective comparing Day 1 baseline score with current score.

---

## 3. Actor-to-Use-Case Traceability Matrix

| Use Case ID | Use Case Name | Student | System Background Engine |
| :--- | :--- | :---: | :---: |
| **UC-01** | Set 90-Day Goal & Motivation | Primary | Validator / Storage |
| **UC-02** | Allocate Free Time & Auto-Schedule | Primary | Schedule Generator |
| **UC-03** | Build 2-Minute Habit Loop | Primary | Habit Engine |
| **UC-04** | View Dashboard & Progression | Primary | Aggregator |
| **UC-05** | Daily Plan & If-Then Shield | Primary | State Manager |
| **UC-06** | Focus Timer & Micro-Log | Primary | Accurate Countdown Engine |
| **UC-07** | End Day 3-Prompt Reflection | Primary | Scoreboard Processor |
| **UC-08** | Activate 24h Safety Net | Primary | Streak Protection Guard |
| **UC-09** | Weekly Review & Deliberate Practice | Primary | Notification Scheduler |
| **UC-10** | Track Scoreboard & Phase Advancement | Primary | Milestone Engine |
