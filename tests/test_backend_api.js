/**
 * SMS - Self Management System
 * Backend API Integration Test Suite
 * Tests Express REST Endpoints and SQLite Database Operations
 */

const http = require('http');

const PORT = 3000;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  [PASS] ${message}`);
  } else {
    testsFailed++;
    console.error(`  [FAIL] ${message}`);
  }
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runApiTests() {
  console.log('========================================================');
  console.log('🧪 Running SMS Backend API Integration Tests (Node + SQLite)');
  console.log('========================================================\n');

  // Test 1: Health Check
  const health = await request('GET', '/api/health');
  assert(health.status === 200, 'Health endpoint returns HTTP 200');
  assert(health.body.data.database === 'sqlite3', 'Backend uses SQLite3 database');

  // Test 2: Reset to Day 1
  const reset = await request('POST', '/api/v1/beta/reset-day1');
  assert(reset.status === 200, 'Beta reset-day1 endpoint returns HTTP 200');

  // Test 3: Dashboard Summary (Initial Day 1)
  const dash1 = await request('GET', '/api/v1/dashboard/summary');
  assert(dash1.status === 200, 'Dashboard summary returns HTTP 200');
  assert(dash1.body.data.roadmap.currentDay === 1, 'Initial roadmap starts on Day 1');
  assert(dash1.body.data.roadmap.phaseNumber === 1, 'Initial phase is Phase 1');
  assert(dash1.body.data.scoreboard.priority === 0, 'Initial scoreboard priority is 0');

  // Test 4: Daily Loop Plan
  const plan = await request('POST', '/api/v1/daily-loop/plan', {
    top1_task: 'Learn 5 new English words',
    scheduled_time: '19:50',
    duration_mins: 20,
    if_trigger: 'want to use phone',
    then_action: 'Put phone out of reach',
    min_habit_completed: true
  });
  assert(plan.status === 200, 'Plan submission returns HTTP 200');
  assert(plan.body.data.awardedSkills.priority === 1, 'Plan awards Priority score 1/1');
  assert(plan.body.data.awardedSkills.discipline === 1, 'Plan awards Discipline score 1/1');

  // Test 5: Focus Start & Finish
  const focusStart = await request('POST', '/api/v1/focus/start');
  assert(focusStart.status === 200, 'Focus start returns HTTP 200');

  const focusFinish = await request('POST', '/api/v1/focus/finish', {
    actual_seconds: 1200,
    summary_1sentence: 'Mastered 5 vocabulary words',
    next_step: 'Review tomorrow morning'
  });
  assert(focusFinish.status === 200, 'Focus finish returns HTTP 200');
  assert(focusFinish.body.data.awardedSkills.habit === 1, 'Focus finish awards Habit score 1/1');

  // Test 6: End Day Reflection
  const endDay = await request('POST', '/api/v1/daily-loop/end-day', {
    intended_outcome: 'Learn 5 words',
    what_happened: 'Learned all 5 words smoothly',
    tweak_tomorrow: 'Test pronunciation with native audio'
  });
  assert(endDay.status === 200, 'End Day reflection returns HTTP 200');
  assert(endDay.body.data.awardedSkills.selfLearning === 1, 'Reflection awards Self-Learning 1/1');
  assert(endDay.body.data.updatedStreak === 1, 'Streak increments to 1 after completion');

  // Test 7: 24h Safety Net (Anti-Guilt Protocol)
  const safety = await request('POST', '/api/v1/daily-loop/safety-net/activate', {
    switch_open: true,
    reason: 'exhausted from sports',
    tomorrow_micro_action: 'Only do homework for minimum of 2 mins'
  });
  assert(safety.status === 200, '24h Safety Net returns HTTP 200');
  assert(safety.body.data.safetyNetActive === true, 'Safety net successfully opened');
  assert(safety.body.data.awardedSkills.grit === 1, 'Grit (Reset) score 1/1 awarded');
  assert(safety.body.data.streakPreserved === true, 'Streak is preserved');

  // Test 8: Beta Fast-Forward: Skip Day
  const skip = await request('POST', '/api/v1/beta/skip-day', { count: 1 });
  assert(skip.status === 200, 'Skip Day returns HTTP 200');
  assert(skip.body.data.currentDay === 2, 'Roadmap advanced to Day 2 in database');

  // Test 9: Beta Fast-Forward: Jump to Phase 2 (Day 31)
  const jumpP2 = await request('POST', '/api/v1/beta/jump-day', { targetDay: 31 });
  assert(jumpP2.status === 200, 'Jump Day returns HTTP 200');
  assert(jumpP2.body.data.currentDay === 31, 'Jumped to Day 31');
  assert(jumpP2.body.data.currentPhase === 2, 'Day 31 transitions to Phase 2: Habit + Grit');

  // Test 10: Beta Fast-Forward: Jump to Phase 3 (Day 61)
  const jumpP3 = await request('POST', '/api/v1/beta/jump-day', { targetDay: 61 });
  assert(jumpP3.body.data.currentPhase === 3, 'Day 61 transitions to Phase 3: Mastery & Self-Learning');

  // Test 11: Weekly Review Finalize
  const weekly = await request('POST', '/api/v1/weekly-review/finalize', {
    key_results: [
      'Complete 3 English listening tests',
      'Master 3 advanced vocabulary words daily',
      'Practice speaking for 15 minutes every morning'
    ],
    deliberate_practice_focus: 'Pronunciation: Shadowing technique',
    schedule_blocks: [
      { day: 'Tue', time: '19:45', durationMins: 20 },
      { day: 'Thu', time: '19:45', durationMins: 20 },
      { day: 'Sat', time: '09:30', durationMins: 25 }
    ]
  });
  assert(weekly.status === 200, 'Weekly review finalize returns HTTP 200');

  // Test 12: Current User Profile (auth/me)
  const me = await request('GET', '/api/v1/auth/me');
  assert(me.status === 200, 'auth/me returns HTTP 200');
  assert(me.body.data.fullName.length > 0, 'auth/me returns student fullName');
  assert(Array.isArray(me.body.data.abilitiesHax), 'auth/me returns abilitiesHax array');

  // Test 13: Update User Profile (Name, Avatar, Description, Abilities)
  const updatedAbilities = [
    { id: 'hax-1', name: '90-Second Ritual', icon: '⚡', type: 'Discipline', description: 'Quick start', active: true },
    { id: 'hax-test', name: 'Ultra Deep Work', icon: '🚀', type: 'Focus', description: 'Laser focus block', active: true, isCustom: true }
  ];
  const updateProf = await request('PUT', '/api/v1/user/profile', {
    full_name: 'Trần Quang Khôi An (Master)',
    avatar_url: '🚀',
    description: 'Master of self-regulation and deliberate practice.',
    abilities_hax: updatedAbilities
  });
  assert(updateProf.status === 200, 'PUT /api/v1/user/profile returns HTTP 200');
  assert(updateProf.body.data.avatarUrl === '🚀', 'Profile avatar updated to 🚀');
  assert(updateProf.body.data.abilitiesHax.length === 2, 'Abilities/Hax updated in SQLite');

  // Test 14: Update Habit
  const updateHab = await request('PUT', '/api/v1/user/habit', {
    habit_cue: 'Right after dinner at 19:30',
    micro_routine_2min: 'Sit down and solve 1 advanced problem',
    immediate_reward: 'Listen to favourite soundtrack'
  });
  assert(updateHab.status === 200, 'PUT /api/v1/user/habit returns HTTP 200');
  assert(updateHab.body.data.habitCue === 'Right after dinner at 19:30', 'Habit cue updated in SQLite');

  // Test 15: Register New User
  const testEmail = `testuser_${Date.now()}@vinschool.edu.vn`;
  const regUser = await request('POST', '/api/v1/auth/register', {
    fullName: 'Minh Chau',
    email: testEmail,
    password: 'password123',
    avatarUrl: '👩‍🔬',
    description: 'Science enthusiast building daily study habits.'
  });
  assert(regUser.status === 200, 'POST /api/v1/auth/register returns HTTP 200');
  assert(regUser.body.data.email === testEmail, 'New user successfully registered in SQLite');

  // Test 16: Login with New User Credentials
  const loginUser = await request('POST', '/api/v1/auth/login', {
    email: testEmail,
    password: 'password123'
  });
  assert(loginUser.status === 200, 'POST /api/v1/auth/login returns HTTP 200');
  assert(loginUser.body.data.fullName === 'Minh Chau', 'Login returns authenticated user');

  // Test 17: Login with Invalid Password (should fail with 401)
  const failLogin = await request('POST', '/api/v1/auth/login', {
    email: testEmail,
    password: 'wrong_password'
  });
  assert(failLogin.status === 401, 'Login with incorrect password returns HTTP 401');

  // Test 18: Register with Optional Email Omitted (Username Only)
  const regNoEmail = await request('POST', '/api/v1/auth/register', {
    fullName: 'TestUserNoEmail',
    password: 'securePass123',
    avatarUrl: '🦁',
    description: 'User registered without providing email.'
  });
  assert(regNoEmail.status === 200, 'Registering with email omitted succeeds with HTTP 200');
  assert(regNoEmail.body.data.fullName === 'TestUserNoEmail', 'User registered with username only');

  // Test 19: Login with Username (No email required)
  const loginUsername = await request('POST', '/api/v1/auth/login', {
    username: 'TestUserNoEmail',
    password: 'securePass123'
  });
  assert(loginUsername.status === 200, 'Login using username only succeeds with HTTP 200');
  assert(loginUsername.body.data.fullName === 'TestUserNoEmail', 'Authenticated user by username');

  console.log('\n========================================================');
  console.log(`Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('========================================================');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
