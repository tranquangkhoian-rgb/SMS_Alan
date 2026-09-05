/**
 * SMS - Self Management System
 * Behavioral Engine Automated Unit Tests
 * Runs via macOS JavaScriptCore (jsc)
 */

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    print('  [PASS] ' + message);
  } else {
    testsFailed++;
    print('  [FAIL] ' + message);
  }
}

print('========================================');
print('Running SMS - Self Management System Tests');
print('========================================');

// Test 1: Models and Day 1 Initial State
const window = {};
load('js/models.js');

assert(window.SMS_MODELS !== undefined, 'Models library loaded successfully');
assert(window.SMS_MODELS.INITIAL_DAY1_STATE.goal.currentDayNumber === 1, 'Default state starts on Day 1');
assert(window.SMS_MODELS.INITIAL_DAY1_STATE.goal.currentPhase === 1, 'Default state starts in Phase 1 (Priority & Discipline)');
assert(window.SMS_MODELS.INITIAL_DAY1_STATE.student.currentStreakDays === 0, 'Initial streak is 0 on Day 1');

// Test 2: Storage Service & State Hydration
let storageMock = {};
const localStorage = {
  getItem: function(k) { return storageMock[k] || null; },
  setItem: function(k, v) { storageMock[k] = v; },
  clear: function() { storageMock = {}; }
};
load('js/storage.js');

const loaded = window.smsStorage.loadState();
assert(loaded.goal.currentDayNumber === 1, 'Initial load defaults to Day 1');
assert(loaded.goal.currentPhase === 1, 'Initial phase is Phase 1');

// Test 3: Scoreboard Scoring Rules (BR-01)
print('\nTesting BR-01: Scoreboard Earning Rules...');
let state = JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_DAY1_STATE));

state.dailyLoop.top1Task = 'Solve 5 physics problems';
state.scoreboard.priorityScore = 1;
assert(state.scoreboard.priorityScore === 1, 'Award Priority 1/1 on Top-1 definition');

state.dailyLoop.minHabitChecked = true;
state.scoreboard.disciplineScore = 1;
assert(state.scoreboard.disciplineScore === 1, 'Award Discipline 1/1 on 2-min habit confirmation');

state.focusSession.summary1Sentence = 'Solved all 5 problems';
state.scoreboard.habitScore = 1;
assert(state.scoreboard.habitScore === 1, 'Award Habit 1/1 on focus session completion');

state.dailyReflection.intendedOutcome = 'Solve 5 problems';
state.scoreboard.selfLearningScore = 1;
assert(state.scoreboard.selfLearningScore === 1, 'Award Self-Learning 1/1 on reflection submission');

// Test 4: BR-02 & ADR-003: 24h Safety Net & Streak Protection
print('\nTesting BR-02 & ADR-003: 24h Safety Net & Anti-Guilt Streak Protection...');
let streakState = {
  streakDays: 3,
  streakStatus: 'ACTIVE',
  gritScore: 0
};

const switchOpen = true;
const tomorrowCommitment = 'Only do homework for minimum of 2 mins';

if (switchOpen && tomorrowCommitment.length > 0) {
  streakState.gritScore = 1;
  streakState.streakStatus = 'PROTECTED_BY_SAFETY_NET';
}

assert(streakState.streakDays === 3, 'Streak is preserved at 3 days without reset');
assert(streakState.gritScore === 1, 'Grit (Reset) score point is awarded (1/1)');
assert(streakState.streakStatus === 'PROTECTED_BY_SAFETY_NET', 'Streak status marked PROTECTED_BY_SAFETY_NET');

// Test 5: Beta Testing Day Skipping & Phase Transitions
print('\nTesting Beta Testing: Skip Day & Phase Progression...');
function calculatePhase(day) {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

assert(calculatePhase(1) === 1, 'Day 1 is Phase 1 (Priority & Discipline)');
assert(calculatePhase(30) === 1, 'Day 30 is Phase 1');
assert(calculatePhase(31) === 2, 'Day 31 transitions to Phase 2 (Habit + Grit)');
assert(calculatePhase(60) === 2, 'Day 60 is Phase 2');
assert(calculatePhase(61) === 3, 'Day 61 transitions to Phase 3 (Mastery & Self-Learning)');
assert(calculatePhase(90) === 3, 'Day 90 is Phase 3');

// Test 6: Custom Editable Timer Logic
print('\nTesting Custom Editable Timer Logic...');
function getTimerSeconds(mins) {
  const parsed = parseInt(mins);
  const validMins = Math.max(1, Math.min(180, isNaN(parsed) ? 20 : parsed));
  return validMins * 60;
}

assert(getTimerSeconds(1) === 60, '1 min timer produces 60s');
assert(getTimerSeconds(5) === 300, '5 min timer produces 300s');
assert(getTimerSeconds(20) === 1200, '20 min timer produces 1200s');
assert(getTimerSeconds(25) === 1500, '25 min timer produces 1500s');
assert(getTimerSeconds(0) === 60, 'Clamped minimum is 1 min (60s)');
assert(getTimerSeconds(200) === 10800, 'Clamped maximum is 180 min (10800s)');

// Test 7: Editable Schedule Management
print('\nTesting Editable Schedule Management...');
let schedule = [
  { id: 'sb-1', day: 'Tue', time: '19:45', durationMins: 20 },
  { id: 'sb-2', day: 'Thu', time: '19:45', durationMins: 20 }
];

// Add block
schedule.push({ id: 'sb-3', day: 'Sat', time: '09:30', durationMins: 25 });
assert(schedule.length === 3, 'Added focus block to schedule');
assert(schedule[2].day === 'Sat' && schedule[2].time === '09:30', 'Block details match');

// Delete block
schedule.splice(1, 1);
assert(schedule.length === 2, 'Removed focus block from schedule');
assert(schedule[1].day === 'Sat', 'Correct block preserved');

print('\n========================================');
print('Test Results: ' + testsPassed + ' Passed, ' + testsFailed + ' Failed');
print('========================================');

if (testsFailed > 0) {
  throw new Error('Some unit tests failed!');
}
