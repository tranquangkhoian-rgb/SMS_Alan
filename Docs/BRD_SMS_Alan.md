# Business Requirements Document (BRD)
## Project Name: SMS - ALAN (Self-Management Skills Alan)
**Version:** 1.0  
**Date:** September 2026  
**Author / Originator:** Trần Quang Khôi An (Vinschool Gifted and Talented Education Center - GATE)  
**Document Status:** Approved Baseline  

---

## 1. Executive Summary

### 1.1 Project Overview
**SMS - ALAN** (Self-Management Skills Alan) is an innovative, science-backed **"Behavioral Operating System" (Behavioral OS)** designed for high school and secondary/university students. Unlike standard productivity or "to-do list" tools that act merely as passive checklists, SMS - ALAN actively reprograms student study habits, builds grit, prevents burnout and guilt spirals, and automates discipline through a structured **90-Day Roadmap**.

The solution merges five foundational behavioral competencies—**Priority, Discipline, Habit, Grit, and Self-Learning**—into a frictionless **Daily Behavioral Loop** (Plan $\rightarrow$ Focus $\rightarrow$ End Day Reflection) and an iterative **Weekly Deliberate Practice Cycle**.

### 1.2 Purpose of this Document
This Business Requirements Document (BRD) defines the business justification, target problem space, theoretical and scientific foundations, functional scope, user personas, high-level business rules, and success metrics for the SMS - ALAN platform. It serves as the authoritative basis for product managers, system architects, UI/UX designers, and developers.

---

## 2. Business Background & Problem Statement

### 2.1 The Problem Discovery Process
Through direct user research, peer interviews, and firsthand personal student experience at Vinschool GATE, the creator observed a pervasive, critical dilemma among ambitious students:

> *"Why do students with big dreams struggle to start or keep going?"*

Students frequently enter academic semesters with immense ambition, crafting comprehensive, aggressive study plans. However, they almost invariably encounter execution failure, psychological friction, and motivational collapse.

```
       [Overambitious Plan]
               │
               ▼
     [Tired / Overwhelmed]
               │
               ▼
   [Procrastination Excuses] ("I'll do it later...")
               │
               ▼
     [Binge Study Session] (One day of high intensity)
               │
               ▼
       [Miss Just ONE Day]
               │
               ▼
    [Guilt & Demoralization]
               │
               ▼
   [Abandon Goals Entirely!]
```

### 2.2 Root Causes Identified

1. **Losing the Big Picture (Micro-task Fixation):**
   * Students get swamped by trivial day-to-day administrative tasks or minor assignments, completely losing sight of high-stakes, overarching 90-day academic goals (e.g., scoring 9.5 in English, mastering standardized exams).
   * Result: Severe grade penalties, missed deadlines for major milestones.

2. **Endless Distractions & Hyperbolic Discounting:**
   * Students know logically that they must study, but the brain inherently prioritizes immediate dopamine rewards (social media, video games, short-form video) over distant academic rewards.
   * Frictionless access to smartphones shatters cognitive focus before deep work can begin.

3. **The "Mood-Driven" Fallacy:**
   * Students rely on fluctuating feelings and spontaneous motivation ("I only study when I feel inspired").
   * In the absence of automated rituals, motivation rapidly evaporates under stress, causing productivity to collapse.

4. **Guilt Spirals & The "All-or-Nothing" Syndrome:**
   * When an intense schedule is broken by even a single day of fatigue or sickness, guilt sets in. Rather than resetting gently, students feel like total failures and abandon their commitments for entire weeks.

5. **Failure of Traditional Productivity Tools:**
   * Conventional to-do apps (Todoist, Apple Reminders, Google Tasks) are **static lists**.
   * They catalog tasks without addressing human psychology, activation energy, habit loops, or emotional recovery. They induce anxiety rather than building resilience and grit.

---

## 3. Project Vision, Mission & Core Values

### 3.1 Vision
To become the premier behavioral OS that empowers every student to transform lofty academic aspirations into automatic, sustainable, daily execution without relying on willpower or mood.

### 3.2 Mission
To provide students with a stress-free, intuitive, scientific system combining micro-habits, implementation intentions, timeboxed deliberate focus, and a non-judgmental 24-hour safety net.

### 3.3 Core Design Principles
* **Stress-Free & Friendly Aesthetic:** Bright, clean, encouraging UI (designed initially in Canva) that eliminates task anxiety.
* **Low Activation Energy:** Every high-resistance task must have a 90-second / 2-minute starting threshold.
* **Anti-Guilt Philosophy:** A missed day is an opportunity for a calibrated micro-reset, never a reason to quit.
* **Closed-Loop Metacognition:** Every cycle of focus terminates with reflection to foster self-learning.

---

## 4. Theoretical & Scientific Foundation

SMS - ALAN is constructed directly upon six peer-reviewed cognitive psychology and behavioral neuroscience principles:

| Science Pillar | Research / Authors | Core Concept & Application in SMS - ALAN |
| :--- | :--- | :--- |
| **Habit Formation Timeline** | **Pippa Lally et al. (UCL, 2010)** | Found that habit automaticity takes an average of **66 days** (ranging between 18 and 254 days). A **90-day program** provides the optimal window to anchor lasting neural behavioral loops. |
| **Deliberate Practice** | **Dr. K. Anders Ericsson (FSU)** | True skill acquisition requires structured repetition with immediate feedback loops, targeting specific sub-skills rather than passive re-reading. |
| **Cognitive Learning Curve** | **Wright (1936)** | Skill acquisition accelerates rapidly in the first 60–90 days before hitting a natural plateau. Structuring the system into a 90-day arc captures this steep learning window. |
| **Neuroplasticity** | **Draganski et al. (2004)** | fMRI studies showed physical structural gray-matter changes in the brain following 3 months of consistent practice (e.g., juggling study). 90 days creates physical neural adaptations. |
| **Stages of Behavior Change** | **Prochaska & DiClemente (Transtheoretical Model)** | Progression moves through: *Precontemplation $\rightarrow$ Contemplation $\rightarrow$ Preparation $\rightarrow$ Action $\rightarrow$ Maintenance*. The transition from Action to Maintenance requires weeks of structured continuity. |
| **Contextual Habit Loops** | **Wood & Neal (2007) / Duhigg / Clear** | Habits do not depend on motivation, but rather on **Frequency of Repetition** within a **Stable Context** through a tight **Cue $\rightarrow$ Routine $\rightarrow$ Reward** architecture. |
| **Implementation Intentions** | **Peter Gollwitzer** | Pre-committing to contingencies using **"IF [Distraction/Obstacle] $\rightarrow$ THEN [Countermeasure]"** rules doubles goal attainment probability. |
| **The 2-Minute Rule** | **David Allen & James Clear** | Shrinking the initiation ritual to under 120 seconds breaks task paralysis by eliminating cognitive resistance at the starting gate. |

---

## 5. The "5-Core" Behavioral Framework

SMS - ALAN operationalizes five interconnected skills into a daily habit engine:

```
               ┌──────────────────────────────┐
               │    1. PRIORITY (Top-1)       │
               │  Filter noise, define #1 task│
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │    2. DISCIPLINE (90-Sec)    │
               │  Trigger instant start rule  │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │       3. HABIT LOOP          │
               │   Cue ➔ Routine ➔ Reward     │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │      4. GRIT (NGU + 24h)     │
               │ 24h safety net prevents guilt│
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │   5. SELF-LEARNING (Review)  │
               │  3 evening reflection prompts│
               └──────────────────────────────┘
```

1. **Skill 1: Priority (#1 Most Important Task)**
   * **Rule:** Identify the single most impactful task for the day ("Top-1"). Protects the student from getting lost in superficial busywork.
2. **Skill 2: Discipline (Immediate Action via 90-Second Ritual)**
   * **Rule:** Overcome procrastination before rationalization starts. Strip task entry to a 90-second / 2-minute physical micro-action (e.g., opening notebook, arranging pens).
3. **Skill 3: Habit (Cue - Routine - Reward Loop)**
   * **Rule:** Anchor study behaviors to an existing daily trigger (e.g., "After school, take bath"), execute the micro-routine (e.g., "Learn 5 vocabulary words"), and provide an immediate positive reward (e.g., "Place sticker and play favorite song").
4. **Skill 4: Grit (NGU - Never Give Up & 24h Safety Net)**
   * **Rule:** Eradicate the toxic guilt cycle. If a student misses their planned focus session, an automatic **24-Hour Safety Net Switch** activates. The user logs the reason (e.g., exhausted, illness) and commits to an emergency 2-minute minimum action for the next day. The streak remains protected.
5. **Skill 5: Self-Learning (3-Prompt Daily Reflection & Deliberate Practice)**
   * **Rule:** Every daily loop concludes with 3 metacognitive prompts:
     1. *Intended Outcome:* What was the target?
     2. *What Happened:* What went wrong or right?
     3. *One Tweak for Tomorrow:* What single adjustment will improve tomorrow's session?

---

## 6. Project Scope

### 6.1 In-Scope (Phase 1 / MVP & Initial Deployment)
* **Student Onboarding Flow (3-Step Wizard):**
  * Step 1: 90-Day Goal Definition (Subject, Current Score, Target Score, Deep Motivation).
  * Step 2: Time Allocation (Daily free time, priority slot time, duration 20–25m, auto-schedule preview).
  * Step 3: Habit Loop Setup (Cue trigger, 2-minute routine, immediate reward).
* **Unified Dashboard:**
  * 90-Day Program progress tracker (Day X/90 and Phase status).
  * Today's Top-1 priority task banner and focus time window.
  * 5-Skill Scoreboard (Priority, Discipline, Habit, Grit Reset, Self-Learning).
  * Quick navigation to Daily Loop and Weekly Review.
* **Daily Loop System (3-Phase Flow):**
  * Step 1 - Plan: Timebox confirmation, If-Then distraction formula, 2-minute minimum habit confirmation.
  * Step 2 - Focus Timer: Clean 20-minute / 25-minute countdown clock with start/reset controls, 1-sentence completion summary, and immediate next-step prompt.
  * Step 3 - End Day: Scoreboard recap, 3 reflection prompts, 24h safety net reset toggle, streak counter.
* **Weekly Review Module:**
  * 90-Day objective alignment.
  * 3 Key Results (OKRs) breakdown with bilingual support (Vietnamese/English).
  * Weekly Priority Focus block scheduling (e.g., Tue, Thu, Sat).
  * Deliberate practice technique definition.

### 6.2 Out-of-Scope (Deferred to v2.0+)
* Multi-user social classrooms / peer leaderboards (designed to protect student privacy and prevent unhealthy social comparison in MVP).
* Direct LMS integrations (Canvas, Google Classroom, Canvas API).
* Automated AI grading or essay evaluation.
* Native mobile app store releases (MVP targets responsive web / Bubble PWA first).

---

## 7. Target Audience & User Personas

### 7.1 Primary Persona: The Ambitious but Overwhelmed High Schooler
* **Name:** Minh / Alan (Grade 10–12 Student)
* **Demographics:** 15–18 years old, attending rigorous bilingual or international schools (e.g., Vinschool).
* **Goals:** Improve academic performance (e.g., raise English from 9.0 to 9.5), master standardized exams, speak English confidently.
* **Frustrations:** Overloaded with coursework, clubs, extracurriculars; prone to cramming one night and giving up the rest of the week; distracted by phone and social media.
* **Needs:** A clear roadmap, bite-sized daily commitments, stress-free interface, and forgiveness when life disrupts the plan.

### 7.2 Secondary Persona: Academic Mentors & Parents
* **Role:** GATE Program Advisors, Teachers, or Parents.
* **Needs:** Clear visibility into whether the student is maintaining self-discipline without having to micromanage or nag.

---

## 8. Business Goals & Success Metrics (KPIs)

| Metric Category | Key Performance Indicator (KPI) | Target Benchmark |
| :--- | :--- | :--- |
| **Engagement & Habit** | Daily Loop Completion Rate | $\ge 75\%$ of enrolled days |
| **Retention** | 90-Day Program Graduation Rate | $\ge 65\%$ completion (vs $<10\%$ industry avg for self-study) |
| **Resilience & Grit** | 24h Safety Net Bounce-Back Rate | $\ge 80\%$ of students who activate the 24h switch resume study the next day |
| **Academic Impact** | Target Goal Attainment Rate | $\ge 70\%$ achieve their stated target grade/score improvement |
| **UX & Mental Wellbeing** | Perceived Stress Index | $\ge 50\%$ reduction in self-reported study guilt/anxiety |

---

## 9. Assumptions, Constraints & Dependencies

### 9.1 Assumptions
* Students have access to a personal computer, tablet, or smartphone for at least 5 minutes before and after study sessions.
* Study blocks are kept short and focused (20 to 25 minutes) to ensure sustainable cognitive endurance.
* The student has a genuine intrinsic motivation documented during onboarding.

### 9.2 Constraints
* Initial implementation platform: No-Code (Bubble) and/or standard HTML5/CSS3/JavaScript responsive web application.
* Minimal cognitive overhead: The user should spend no more than 3 minutes planning and 3 minutes reflecting each day.

### 9.3 Dependencies
* Reliable client-side or cloud storage for user progress, streaks, scoreboard states, and reflection logs.
* Stable timer mechanism immune to mobile browser background throttling.
