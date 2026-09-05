/**
 * SMS - Self Management System
 * Data Models & Reference Datasets
 */

const DEFAULT_SCHEDULE_BLOCKS = [
  { id: 'sb-1', day: 'Tue', time: '19:45', durationMins: 20 },
  { id: 'sb-2', day: 'Thu', time: '19:45', durationMins: 20 },
  { id: 'sb-3', day: 'Sat', time: '09:30', durationMins: 25 }
];

// Day 1 Starting State (Default for all users and initial launch)
const INITIAL_DAY1_STATE = {
  isOnboarded: true,
  activeTab: 'dashboard',
  dailyStep: 'plan',
  student: {
    id: 'student-day1',
    fullName: 'Trần Quang Khôi An',
    email: 'khoian.alan@vinschool.edu.vn',
    currentStreakDays: 0,
    streakStatus: 'ACTIVE',
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  },
  goal: {
    id: 'goal-english-95',
    studentId: 'student-day1',
    subject: 'English',
    baselineScore: '9',
    targetScore: '9.5',
    goalStatement: "Students learn repeatly every day and upgraded their English's score form 9 to 9.5 and talk more confidently.",
    deepMotivation: "Because I want to talk more confidently and showed excellent academic results for future exam that i about to get.",
    currentDayNumber: 1,
    currentPhase: 1, // Phase 1 (Days 1-30): Priority & Discipline
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'IN_PROGRESS'
  },
  habit: {
    id: 'habit-default',
    studentId: 'student-day1',
    habitCue: 'After school...',
    microRoutine2min: 'Sit at my desk and learn 5 new English words.',
    immediateReward: 'Stick a sticker and listen to my favorite song.',
    dailyFreeTimeMins: 30,
    preferredFocusSlot: '19:45',
    focusDurationMins: 20,
    isActive: true
  },
  dailyLoop: {
    id: 'daily-loop-today',
    goalId: 'goal-english-95',
    loopDate: new Date().toISOString().slice(0, 10),
    top1Task: 'Finish English homework and review 5 vocabulary words.',
    scheduledTime: '19:45',
    scheduledDurationMins: 20,
    ifTrigger: 'want to use phone',
    thenAction: 'Put phone out of reach',
    minHabitChecked: false,
    loopStatus: 'NOT_STARTED'
  },
  focusSession: {
    id: 'focus-session-today',
    dailyLoopId: 'daily-loop-today',
    plannedSeconds: 1200, // 20 minutes default
    actualSeconds: 0,
    summary1Sentence: 'Have completed the lesson, learned 5 new words',
    nextStep: 'Next morning, practiced back these 5 words',
    sessionStatus: 'NOT_STARTED'
  },
  dailyReflection: {
    id: 'reflection-today',
    dailyLoopId: 'daily-loop-today',
    intendedOutcome: 'Master the grammar of present tense.',
    whatHappened: 'Still a few mistakes when conjuncting singular verbs',
    tweakTomorrow: 'Read the subject carefully before filling in the answer',
    loggedAt: ''
  },
  gritSafety: {
    id: 'grit-safety-today',
    dailyLoopId: 'daily-loop-today',
    reason: 'exhausted',
    tomorrowMicroAction: 'Only do homework for minimum for 2 mins',
    switchOpen: false,
    activatedAt: ''
  },
  scoreboard: {
    id: 'scoreboard-today',
    dailyLoopId: 'daily-loop-today',
    priorityScore: 0,
    disciplineScore: 0,
    habitScore: 0,
    gritScore: 0,
    selfLearningScore: 0,
    totalDailyScore: 0
  },
  weeklyPlan: {
    id: 'weekly-plan-w1',
    studentId: 'student-day1',
    weekNumber: 1,
    objectiveStatement: 'Study regularly every day and improve your English score from 9.0 to 9.5.',
    keyResults: [
      'Complete 3 English listening tests. (Hoàn thành 3 bài kiểm tra nghe).',
      'Master 3 advanced vocabulary words daily. (Làm chủ 3 từ vựng nâng cao mỗi ngày).',
      'Practice speaking for 15 minutes every morning. (Luyện nói 15 phút mỗi sáng).'
    ],
    scheduleBlocks: [
      { id: 'sb-1', day: 'Tue', time: '19:45', durationMins: 20 },
      { id: 'sb-2', day: 'Thu', time: '19:45', durationMins: 20 },
      { id: 'sb-3', day: 'Sat', time: '09:30', durationMins: 25 }
    ],
    deliberatePracticeFocus: 'Pronunciation: Record my voice and compare it with native speakers to fix ending sounds.'
  }
};

const INITIAL_EMPTY_STATE = {
  isOnboarded: false,
  activeTab: 'goals',
  dailyStep: 'plan',
  student: {
    id: 'student-new',
    fullName: 'New Student',
    email: 'student@example.com',
    currentStreakDays: 0,
    streakStatus: 'ACTIVE',
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  },
  goal: {
    id: 'goal-new',
    studentId: 'student-new',
    subject: 'English',
    baselineScore: '9',
    targetScore: '9.5',
    goalStatement: "Students learn repeatly every day and upgraded their English's score form 9 to 9.5 and talk more confidently.",
    deepMotivation: "Because I want to talk more confidently and showed excellent academic results for future exam that i about to get.",
    currentDayNumber: 1,
    currentPhase: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'IN_PROGRESS'
  },
  habit: {
    id: 'habit-new',
    studentId: 'student-new',
    habitCue: 'After school...',
    microRoutine2min: 'Sit at my desk and learn 5 new English words.',
    immediateReward: 'Stick a sticker and listen to my favorite song.',
    dailyFreeTimeMins: 30,
    preferredFocusSlot: '19:45',
    focusDurationMins: 20,
    isActive: true
  },
  dailyLoop: {
    id: 'daily-loop-new',
    goalId: 'goal-new',
    loopDate: new Date().toISOString().slice(0, 10),
    top1Task: 'Learn 5 new English words',
    scheduledTime: '19:50',
    scheduledDurationMins: 20,
    ifTrigger: 'want to use phone',
    thenAction: 'Put phone out of reach',
    minHabitChecked: false,
    loopStatus: 'NOT_STARTED'
  },
  focusSession: {
    id: 'focus-session-new',
    dailyLoopId: 'daily-loop-new',
    plannedSeconds: 1200,
    actualSeconds: 0,
    summary1Sentence: '',
    nextStep: '',
    sessionStatus: 'NOT_STARTED'
  },
  dailyReflection: {
    id: 'reflection-new',
    dailyLoopId: 'daily-loop-new',
    intendedOutcome: '',
    whatHappened: '',
    tweakTomorrow: '',
    loggedAt: ''
  },
  gritSafety: {
    id: 'grit-safety-new',
    dailyLoopId: 'daily-loop-new',
    reason: '',
    tomorrowMicroAction: 'Only do homework for minimum for 2 mins',
    switchOpen: false,
    activatedAt: ''
  },
  scoreboard: {
    id: 'scoreboard-new',
    dailyLoopId: 'daily-loop-new',
    priorityScore: 0,
    disciplineScore: 0,
    habitScore: 0,
    gritScore: 0,
    selfLearningScore: 0,
    totalDailyScore: 0
  },
  weeklyPlan: {
    id: 'weekly-plan-new',
    studentId: 'student-new',
    weekNumber: 1,
    objectiveStatement: 'Study regularly every day and improve your English score from 9.0 to 9.5.',
    keyResults: [
      'Complete 3 English listening tests. (Hoàn thành 3 bài kiểm tra nghe).',
      'Master 3 advanced vocabulary words daily. (Làm chủ 3 từ vựng nâng cao mỗi ngày).',
      'Practice speaking for 15 minutes every morning. (Luyện nói 15 phút mỗi sáng).'
    ],
    scheduleBlocks: [
      { id: 'sb-1', day: 'Mon', time: '19:45', durationMins: 20 },
      { id: 'sb-2', day: 'Wed', time: '19:45', durationMins: 20 },
      { id: 'sb-3', day: 'Fri', time: '19:45', durationMins: 20 },
      { id: 'sb-4', day: 'Sat', time: '09:30', durationMins: 25 }
    ],
    deliberatePracticeFocus: 'Pronunciation: Record my voice and compare it with native speakers to fix ending sounds.'
  }
};

window.SMS_MODELS = {
  INITIAL_DAY1_STATE,
  INITIAL_EMPTY_STATE,
  DEFAULT_SCHEDULE_BLOCKS
};
