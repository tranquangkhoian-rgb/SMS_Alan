/**
 * SMS - Self Management System
 * Data Models & Reference Datasets
 */

const DEFAULT_SCHEDULE_BLOCKS = [
  { id: 'sb-1', day: 'Tue', time: '19:45', durationMins: 20 },
  { id: 'sb-2', day: 'Thu', time: '19:45', durationMins: 20 },
  { id: 'sb-3', day: 'Sat', time: '09:30', durationMins: 25 }
];

const PRESET_AVATARS = ['🧑‍🎓', '👨‍💻', '👩‍🔬', '🥷', '🦁', '🚀', '⚡', '🧙‍♂️'];

const DEFAULT_ABILITIES_HAX = [
  { id: 'hax-1', name: '90-Second Activation Ritual', icon: '⚡', type: 'Discipline', description: 'Cuts starting resistance to under 90s before excuses kick in.', active: true },
  { id: 'hax-2', name: 'Phone Disruption Shield', icon: '🛡️', type: 'Focus', description: 'IF phone temptation occurs, THEN place phone in another room.', active: true },
  { id: 'hax-3', name: '24h Anti-Guilt Reset', icon: '🔄', type: 'Grit', description: 'Preserves active streak when exhausted by locking tomorrow to 2 minutes.', active: true },
  { id: 'hax-4', name: 'Metacognitive Mirror', icon: '🪞', type: 'Self-Learning', description: '3 evening prompts converting daily errors into tomorrow tweaks.', active: true },
  { id: 'hax-5', name: 'Focus Hyperdrive', icon: '🚀', type: 'Focus', description: 'Deep cognitive stamina booster for high-intensity study blocks.', active: false },
  { id: 'hax-6', name: 'Ruthless Top-1 Filter', icon: '🎯', type: 'Discipline', description: 'Prevents getting lost in busywork by strictly locking 1 task per day.', active: false }
];

const ABILITY_PRESET_TITLES = [
  { title: '90-Second Instant Start', type: 'Discipline', icon: '⚡', whatICanDo: 'Cut starting friction to under 90 seconds before excuses kick in.' },
  { title: 'Phone Disruption Shield', type: 'Focus', icon: '🛡️', whatICanDo: 'Place phone in another room or turn on Do Not Disturb when studying.' },
  { title: '24h Anti-Guilt Reset', type: 'Grit', icon: '🔄', whatICanDo: 'If exhausted or miss a day, lock tomorrow to a 2-minute micro-action to preserve streak.' },
  { title: 'Metacognitive Mirror', type: 'Self-Learning', icon: '🪞', whatICanDo: 'Answer 3 evening reflection prompts to turn today’s mistakes into tomorrow’s adjustments.' },
  { title: 'Hyperfocus Sprint', type: 'Focus', icon: '🚀', whatICanDo: 'Study in continuous 20-minute flow sessions with single-task commitment.' },
  { title: 'Ruthless Top-1 Filter', type: 'Discipline', icon: '🎯', whatICanDo: 'Strictly lock 1 primary task per day and finish it before touching anything else.' },
  { title: '5-Minute Momentum Hook', type: 'Discipline', icon: '⏱️', whatICanDo: 'Commit to working for only 5 minutes; let momentum take care of the rest.' },
  { title: 'Feynman Simplifier', type: 'Self-Learning', icon: '🧠', whatICanDo: 'Explain the core concept out loud in plain, simple language without jargon.' },
  { title: 'Energy Recharge Protocol', type: 'Grit', icon: '🔋', whatICanDo: 'Take a 3-minute physical movement & water break when mental fatigue hits.' },
  { title: 'Custom Ability', type: 'Custom', icon: '✨', whatICanDo: 'Type what you can do...' }
];

// Blank Guest Starting State (Default on first launch)
const INITIAL_GUEST_STATE = {
  isGuest: true,
  isOnboarded: true,
  activeTab: 'dashboard',
  dailyStep: 'plan',
  student: {
    id: 'guest',
    fullName: 'Guest User',
    email: '',
    avatarUrl: '👤',
    description: '',
    isGuest: true,
    abilitiesHax: [], // Clean slate: user types what they can do
    currentStreakDays: 0,
    streakStatus: 'ACTIVE',
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  },
  goal: {
    id: 'goal-guest',
    studentId: 'guest',
    subject: '',
    baselineScore: '',
    targetScore: '',
    goalStatement: '',
    deepMotivation: '',
    currentDayNumber: 1,
    currentPhase: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'IN_PROGRESS'
  },
  habit: {
    id: 'habit-guest',
    studentId: 'guest',
    habitCue: '',
    microRoutine2min: '',
    immediateReward: '',
    dailyFreeTimeMins: 30,
    preferredFocusSlot: '19:00',
    focusDurationMins: 20,
    isActive: false
  },
  dailyLoop: {
    id: 'daily-loop-guest',
    goalId: 'goal-guest',
    loopDate: new Date().toISOString().slice(0, 10),
    top1Task: '',
    scheduledTime: '19:00',
    scheduledDurationMins: 20,
    ifTrigger: '',
    thenAction: '',
    minHabitChecked: false,
    loopStatus: 'NOT_STARTED'
  },
  focusSession: {
    id: 'focus-session-guest',
    dailyLoopId: 'daily-loop-guest',
    plannedSeconds: 1200,
    actualSeconds: 0,
    summary1Sentence: '',
    nextStep: '',
    sessionStatus: 'NOT_STARTED'
  },
  dailyReflection: {
    id: 'reflection-guest',
    dailyLoopId: 'daily-loop-guest',
    intendedOutcome: '',
    whatHappened: '',
    tweakTomorrow: '',
    loggedAt: ''
  },
  gritSafety: {
    id: 'grit-safety-guest',
    dailyLoopId: 'daily-loop-guest',
    reason: '',
    tomorrowMicroAction: '',
    switchOpen: false,
    activatedAt: ''
  },
  scoreboard: {
    id: 'scoreboard-guest',
    dailyLoopId: 'daily-loop-guest',
    priorityScore: 0,
    disciplineScore: 0,
    habitScore: 0,
    gritScore: 0,
    selfLearningScore: 0,
    totalDailyScore: 0
  },
  weeklyPlan: {
    id: 'weekly-plan-guest',
    studentId: 'guest',
    weekNumber: 1,
    objectiveStatement: '',
    keyResults: ['', '', ''],
    scheduleBlocks: [],
    deliberatePracticeFocus: ''
  }
};

// Prefilled Alan Demo State (For testing / demonstration)
const ALAN_DEMO_STATE = {
  isGuest: false,
  isOnboarded: true,
  activeTab: 'dashboard',
  dailyStep: 'plan',
  student: {
    id: 'student-alan-001',
    fullName: 'Trần Quang Khôi An',
    email: 'khoian.alan@vinschool.edu.vn',
    avatarUrl: '🧑‍🎓',
    description: 'Vinschool Gifted & Talented student building unstoppable daily self-management habits.',
    isGuest: false,
    abilitiesHax: JSON.parse(JSON.stringify(DEFAULT_ABILITIES_HAX)),
    currentStreakDays: 0,
    streakStatus: 'ACTIVE',
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  },
  goal: {
    id: 'goal-english-95',
    studentId: 'student-alan-001',
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
    id: 'habit-default',
    studentId: 'student-alan-001',
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
    plannedSeconds: 1200,
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
    studentId: 'student-alan-001',
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

const INITIAL_DAY1_STATE = INITIAL_GUEST_STATE;

const INITIAL_EMPTY_STATE = {
  isGuest: true,
  isOnboarded: false,
  activeTab: 'goals',
  dailyStep: 'plan',
  student: {
    id: 'guest',
    fullName: 'Guest User',
    email: '',
    avatarUrl: '👤',
    description: '',
    isGuest: true,
    abilitiesHax: [],
    currentStreakDays: 0,
    streakStatus: 'ACTIVE',
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  },
  goal: {
    id: 'goal-new',
    studentId: 'guest',
    subject: '',
    baselineScore: '',
    targetScore: '',
    goalStatement: '',
    deepMotivation: '',
    currentDayNumber: 1,
    currentPhase: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    status: 'IN_PROGRESS'
  },
  habit: {
    id: 'habit-new',
    studentId: 'guest',
    habitCue: '',
    microRoutine2min: '',
    immediateReward: '',
    dailyFreeTimeMins: 30,
    preferredFocusSlot: '19:00',
    focusDurationMins: 20,
    isActive: false
  },
  dailyLoop: {
    id: 'daily-loop-new',
    goalId: 'goal-new',
    loopDate: new Date().toISOString().slice(0, 10),
    top1Task: '',
    scheduledTime: '19:00',
    scheduledDurationMins: 20,
    ifTrigger: '',
    thenAction: '',
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
    tomorrowMicroAction: '',
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
    studentId: 'guest',
    weekNumber: 1,
    objectiveStatement: '',
    keyResults: ['', '', ''],
    scheduleBlocks: [],
    deliberatePracticeFocus: ''
  }
};

window.SMS_MODELS = {
  INITIAL_GUEST_STATE,
  INITIAL_DAY1_STATE,
  ALAN_DEMO_STATE,
  INITIAL_EMPTY_STATE,
  DEFAULT_SCHEDULE_BLOCKS,
  PRESET_AVATARS,
  DEFAULT_ABILITIES_HAX,
  ABILITY_PRESET_TITLES
};
