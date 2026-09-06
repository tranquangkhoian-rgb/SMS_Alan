/**
 * SMS - ALAN (Self-Management Skills Alan)
 * Domain Models & TypeScript Interfaces
 * Based on Vinschool GATE Specifications
 */

export type StreakStatus = 'ACTIVE' | 'PROTECTED_BY_SAFETY_NET' | 'BROKEN';
export type LoopStatus = 'NOT_STARTED' | 'PLANNED' | 'FOCUSED' | 'COMPLETED' | 'SAFETY_NET_RESET';
export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABORTED';
export type ViewTab = 'dashboard' | 'goals' | 'daily-loop' | 'weekly';
export type DailyStep = 'plan' | 'timer' | 'end-day';

export interface AbilityHax {
  id: string;
  name: string;
  icon: string;
  type: 'Discipline' | 'Focus' | 'Grit' | 'Self-Learning' | 'Custom';
  description: string;
  active: boolean;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  description: string;
  abilitiesHax: AbilityHax[];
  currentStreakDays: number;
  streakStatus: StreakStatus;
  lastActiveDate: string;
  createdAt: string;
}

export interface Goal90Day {
  id: string;
  studentId: string;
  subject: string;
  baselineScore: string;
  targetScore: string;
  goalStatement: string;
  deepMotivation: string;
  currentDayNumber: number; // 1 to 90
  currentPhase: number; // 1: Priority & Discipline, 2: Habit + Grit, 3: Mastery & Self-Learning
  startDate: string;
  endDate: string;
  status: 'IN_PROGRESS' | 'GRADUATED' | 'PAUSED';
}

export interface HabitProfile {
  id: string;
  studentId: string;
  habitCue: string;
  microRoutine2min: string;
  immediateReward: string;
  dailyFreeTimeMins: number;
  preferredFocusSlot: string; // e.g. "19:45"
  focusDurationMins: number; // e.g. 20
  isActive: boolean;
}

export interface DailyLoop {
  id: string;
  goalId: string;
  loopDate: string; // YYYY-MM-DD
  top1Task: string;
  scheduledTime: string;
  scheduledDurationMins: number;
  ifTrigger: string;
  thenAction: string;
  minHabitChecked: boolean;
  loopStatus: LoopStatus;
}

export interface FocusSession {
  id: string;
  dailyLoopId: string;
  startedAt?: string;
  endedAt?: string;
  plannedSeconds: number;
  actualSeconds: number;
  summary1Sentence: string;
  nextStep: string;
  sessionStatus: SessionStatus;
}

export interface DailyReflection {
  id: string;
  dailyLoopId: string;
  intendedOutcome: string;
  whatHappened: string;
  tweakTomorrow: string;
  loggedAt: string;
}

export interface GritSafetyEvent {
  id: string;
  dailyLoopId: string;
  reason: string;
  tomorrowMicroAction: string;
  switchOpen: boolean;
  activatedAt: string;
}

export interface SkillScoreboard {
  id: string;
  dailyLoopId: string;
  priorityScore: number; // 0 or 1
  disciplineScore: number; // 0 or 1
  habitScore: number; // 0 or 1
  gritScore: number; // 0 or 1
  selfLearningScore: number; // 0 or 1
  totalDailyScore: number; // 0 to 5
}

export interface WeeklyPlan {
  id: string;
  studentId: string;
  weekNumber: number;
  objectiveStatement: string;
  keyResults: [string, string, string];
  scheduleBlocks: {
    day: string;
    time: string;
    durationMins: number;
  }[];
  deliberatePracticeFocus: string;
}

export interface AppState {
  student: StudentProfile;
  goal: Goal90Day;
  habit: HabitProfile;
  dailyLoop: DailyLoop;
  focusSession: FocusSession;
  dailyReflection: DailyReflection;
  gritSafety: GritSafetyEvent;
  scoreboard: SkillScoreboard;
  weeklyPlan: WeeklyPlan;
  activeTab: ViewTab;
  dailyStep: DailyStep;
  isOnboarded: boolean;
}
