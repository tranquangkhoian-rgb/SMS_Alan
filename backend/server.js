/**
 * SMS - Self Management System
 * Express REST API Server with SQLite3 Database
 * Implements REST Endpoints specified in Docs/Design_Document_SMS_Alan.md
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, run, get, all, initDb, seedDay1, registerUser, loginUser } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend assets from workspace root
app.use(express.static(path.join(__dirname, '..')));

// Helper response envelope
const successResponse = (res, data, message = null, status = 200) => {
  return res.status(status).json({
    status: 'success',
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, message, status = 400) => {
  return res.status(status).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  });
};

// Helper to resolve currently active student by header (x-user-id), query param, or fallback
const getCurrentStudent = async (req) => {
  const userId = req.headers['x-user-id'] || (req.query && req.query.user_id);
  if (userId === 'guest') {
    return null;
  }
  if (userId) {
    const student = await get(`SELECT * FROM students WHERE id = ?`, [userId]);
    if (student) return student;
  }
  // Return most recent non-guest student if available, else first student
  const latestNonGuest = await get(`SELECT * FROM students WHERE id != 'guest' ORDER BY created_at DESC LIMIT 1`);
  if (latestNonGuest) return latestNonGuest;
  return await get(`SELECT * FROM students LIMIT 1`);
};

/* ========================================================
   1. Health & Status
   ======================================================== */
app.get('/api/health', (req, res) => {
  successResponse(res, { status: 'healthy', database: 'sqlite3', port: PORT }, 'SMS Backend API is operational');
});

/* ========================================================
   Auth & Account Management APIs
   ======================================================== */
// Register / Create Account
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, fullName, avatar_url, avatarUrl, description, abilities } = req.body;
    const name = (fullName || full_name || '').trim();
    if (!name && !email) {
      return errorResponse(res, 'Full Name or Username is required', 400);
    }
    const student = await registerUser({
      email: email ? email.trim() : '',
      password: password || '123456',
      fullName: name || 'New Student',
      avatarUrl: avatarUrl || avatar_url || '🧑‍🎓',
      description: description || 'Building daily self-management habits.',
      abilities
    });
    successResponse(res, {
      id: student.id,
      email: student.email,
      fullName: student.full_name,
      avatarUrl: student.avatar_url,
      description: student.description,
      abilitiesHax: JSON.parse(student.abilities_hax_json || '[]')
    }, 'Account successfully created!', 200);
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
});

// Login (supports Username or Email)
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const query = (identifier || email || username || '').trim();
    if (!query) {
      return errorResponse(res, 'Username or Email is required', 400);
    }
    const student = await loginUser({ identifier: query, password });
    successResponse(res, student, 'Login successful!');
  } catch (err) {
    errorResponse(res, err.message, 401);
  }
});

// Current User Profile & Habit
app.get('/api/v1/auth/me', async (req, res) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student) return errorResponse(res, 'No student found', 404);

    const habit = await get(`SELECT * FROM habit_profiles WHERE student_id = ? LIMIT 1`, [student.id]);

    successResponse(res, {
      id: student.id,
      email: student.email,
      fullName: student.full_name,
      avatarUrl: student.avatar_url || '🧑‍🎓',
      description: student.description || '',
      abilitiesHax: JSON.parse(student.abilities_hax_json || '[]'),
      streakDays: student.current_streak_days,
      streakStatus: student.streak_status,
      habit: habit ? {
        habitCue: habit.habit_cue,
        microRoutine2min: habit.micro_routine_2min,
        immediateReward: habit.immediate_reward
      } : null
    });
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Update Profile (Name, Avatar, Description, Abilities/Hax)
app.put('/api/v1/user/profile', async (req, res) => {
  try {
    const { full_name, avatar_url, description, abilities_hax } = req.body;
    const student = await getCurrentStudent(req);
    if (!student) return errorResponse(res, 'No student found', 404);

    const updatedName = full_name !== undefined ? full_name : student.full_name;
    const updatedAvatar = avatar_url !== undefined ? avatar_url : (student.avatar_url || '🧑‍🎓');
    const updatedDesc = description !== undefined ? description : (student.description || '');
    const updatedAbilities = abilities_hax !== undefined ? JSON.stringify(abilities_hax) : student.abilities_hax_json;

    await run(`
      UPDATE students
      SET full_name = ?, avatar_url = ?, description = ?, abilities_hax_json = ?
      WHERE id = ?
    `, [updatedName, updatedAvatar, updatedDesc, updatedAbilities, student.id]);

    successResponse(res, {
      id: student.id,
      fullName: updatedName,
      avatarUrl: updatedAvatar,
      description: updatedDesc,
      abilitiesHax: JSON.parse(updatedAbilities || '[]')
    }, 'Profile and abilities updated successfully!');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Update Habit
app.put('/api/v1/user/habit', async (req, res) => {
  try {
    const { habit_cue, micro_routine_2min, immediate_reward } = req.body;
    const student = await getCurrentStudent(req);
    if (!student) return errorResponse(res, 'No student found', 404);

    await run(`
      UPDATE habit_profiles
      SET habit_cue = ?, micro_routine_2min = ?, immediate_reward = ?
      WHERE student_id = ?
    `, [habit_cue, micro_routine_2min, immediate_reward, student.id]);

    successResponse(res, {
      habitCue: habit_cue,
      microRoutine2min: micro_routine_2min,
      immediateReward: immediate_reward
    }, 'Habit configuration updated!');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

/* ========================================================
   2. Dashboard API
   ======================================================== */
app.get('/api/v1/dashboard/summary', async (req, res) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student) return errorResponse(res, 'No student found or guest mode active', 404);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    if (!goal) return errorResponse(res, 'No goal found for student', 404);
    const dailyLoop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);
    const scoreboard = dailyLoop ? await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [dailyLoop.id]) : null;

    const phaseNames = ['', 'Phase 1: Priority & Discipline', 'Phase 2: Habit + Grit', 'Phase 3: Mastery & Self-Learning'];

    const data = {
      student: {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        avatarUrl: student.avatar_url || '🧑‍🎓',
        description: student.description || '',
        abilitiesHax: JSON.parse(student.abilities_hax_json || '[]'),
        streakDays: student.current_streak_days,
        streakStatus: student.streak_status
      },
      roadmap: {
        currentDay: goal.current_day_number,
        totalDays: 90,
        phaseNumber: goal.current_phase,
        phaseName: phaseNames[goal.current_phase] || '',
        status: goal.status
      },
      todayTask: dailyLoop ? {
        top1Title: dailyLoop.top1_task,
        scheduledTime: dailyLoop.scheduled_time,
        durationMins: dailyLoop.scheduled_duration_mins,
        loopStatus: dailyLoop.loop_status
      } : null,
      scoreboard: scoreboard ? {
        priority: scoreboard.priority_score,
        discipline: scoreboard.discipline_score,
        habit: scoreboard.habit_score,
        grit: scoreboard.grit_score,
        selfLearning: scoreboard.self_learning_score,
        totalScore: scoreboard.total_daily_score
      } : { priority: 0, discipline: 0, habit: 0, grit: 0, selfLearning: 0, totalScore: 0 }
    };

    successResponse(res, data);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

/* ========================================================
   3. Daily Loop APIs (Plan -> Focus -> End Day)
   ======================================================== */
app.get('/api/v1/daily-loop/today', async (req, res) => {
  try {
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    if (!loop) {
      return errorResponse(res, 'No daily loop found', 404);
    }

    const session = await get(`SELECT * FROM focus_sessions WHERE daily_loop_id = ?`, [loop.id]);
    const reflection = await get(`SELECT * FROM daily_reflections WHERE daily_loop_id = ?`, [loop.id]);
    const safety = await get(`SELECT * FROM grit_safety_events WHERE daily_loop_id = ?`, [loop.id]);
    const scoreboard = await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [loop.id]);

    successResponse(res, {
      loop,
      session,
      reflection,
      safety,
      scoreboard,
      studentStreak: student.current_streak_days
    });
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Step 1: Submit Plan & If-Then Shield
app.post('/api/v1/daily-loop/plan', async (req, res) => {
  try {
    const { top1_task, scheduled_time, duration_mins, if_trigger, then_action, min_habit_completed } = req.body;
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    const plannedMins = parseInt(duration_mins) || 20;

    await run(`
      UPDATE daily_loops
      SET top1_task = ?, scheduled_time = ?, scheduled_duration_mins = ?, if_trigger = ?, then_action = ?, min_habit_checked = ?, loop_status = 'PLANNED'
      WHERE id = ?
    `, [top1_task, scheduled_time, plannedMins, if_trigger, then_action, min_habit_completed ? 1 : 0, loop.id]);

    // Update Focus Session planned duration
    await run(`
      UPDATE focus_sessions
      SET planned_seconds = ?
      WHERE daily_loop_id = ?
    `, [plannedMins * 60, loop.id]);

    // Award Priority and Discipline points
    const priorityScore = 1;
    const disciplineScore = min_habit_completed ? 1 : 0;

    await run(`
      UPDATE skill_scoreboards
      SET priority_score = ?, discipline_score = ?, total_daily_score = priority_score + discipline_score + habit_score + grit_score + self_learning_score
      WHERE daily_loop_id = ?
    `, [priorityScore, disciplineScore, loop.id]);

    const updatedScoreboard = await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [loop.id]);

    successResponse(res, {
      dailyLoopId: loop.id,
      loopStatus: 'PLANNED',
      awardedSkills: {
        priority: priorityScore,
        discipline: disciplineScore
      },
      scoreboard: updatedScoreboard,
      nextStep: 'FOCUS_TIMER'
    }, 'Daily Plan confirmed and locked.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Step 2: Start Focus Timer
app.post('/api/v1/focus/start', async (req, res) => {
  try {
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    await run(`
      UPDATE focus_sessions
      SET started_at = ?, session_status = 'IN_PROGRESS'
      WHERE daily_loop_id = ?
    `, [new Date().toISOString(), loop.id]);

    const session = await get(`SELECT * FROM focus_sessions WHERE daily_loop_id = ?`, [loop.id]);
    successResponse(res, session, 'Focus session started');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Step 2: Finish Focus Timer & Micro-Log
app.post('/api/v1/focus/finish', async (req, res) => {
  try {
    const { actual_seconds, summary_1sentence, next_step } = req.body;
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    await run(`
      UPDATE focus_sessions
      SET ended_at = ?, actual_seconds = ?, summary_1sentence = ?, next_step = ?, session_status = 'COMPLETED'
      WHERE daily_loop_id = ?
    `, [new Date().toISOString(), parseInt(actual_seconds) || 1200, summary_1sentence, next_step, loop.id]);

    await run(`UPDATE daily_loops SET loop_status = 'FOCUSED' WHERE id = ?`, [loop.id]);

    // Award Habit skill
    await run(`
      UPDATE skill_scoreboards
      SET habit_score = 1, total_daily_score = priority_score + discipline_score + habit_score + grit_score + self_learning_score
      WHERE daily_loop_id = ?
    `, [loop.id]);

    const updatedScoreboard = await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [loop.id]);

    successResponse(res, {
      awardedSkills: { habit: 1 },
      scoreboard: updatedScoreboard,
      nextStep: 'END_DAY_REFLECTION'
    }, 'Focus logged successfully!');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Step 3: End Day Reflection & Close Loop
app.post('/api/v1/daily-loop/end-day', async (req, res) => {
  try {
    const { intended_outcome, what_happened, tweak_tomorrow } = req.body;
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    await run(`
      UPDATE daily_reflections
      SET intended_outcome = ?, what_happened = ?, tweak_tomorrow = ?, logged_at = ?
      WHERE daily_loop_id = ?
    `, [intended_outcome, what_happened, tweak_tomorrow, new Date().toISOString(), loop.id]);

    // Award Self-Learning score if reflection filled
    const selfLearningScore = (intended_outcome && intended_outcome.trim().length > 0) ? 1 : 0;

    await run(`
      UPDATE skill_scoreboards
      SET self_learning_score = ?, total_daily_score = priority_score + discipline_score + habit_score + grit_score + self_learning_score
      WHERE daily_loop_id = ?
    `, [selfLearningScore, loop.id]);

    await run(`UPDATE daily_loops SET loop_status = 'COMPLETED' WHERE id = ?`, [loop.id]);

    // Update streak if session completed or safety net active
    const scoreboard = await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [loop.id]);
    const safety = await get(`SELECT * FROM grit_safety_events WHERE daily_loop_id = ?`, [loop.id]);

    let newStreak = student.current_streak_days;
    if (scoreboard.habit_score === 1 || (safety && safety.switch_open === 1)) {
      newStreak += 1;
      await run(`
        UPDATE students
        SET current_streak_days = ?, last_active_date = ?
        WHERE id = ?
      `, [newStreak, new Date().toISOString().slice(0, 10), student.id]);
    }

    successResponse(res, {
      awardedSkills: { selfLearning: selfLearningScore },
      updatedStreak: newStreak,
      scoreboardFinal: scoreboard
    }, 'Daily loop successfully closed and saved.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Step 3: 24h Safety Net (Anti-Guilt Protocol)
app.post('/api/v1/daily-loop/safety-net/activate', async (req, res) => {
  try {
    const { switch_open, reason, tomorrow_micro_action } = req.body;
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);

    const isOpen = switch_open ? 1 : 0;

    await run(`
      UPDATE grit_safety_events
      SET switch_open = ?, reason = ?, tomorrow_micro_action = ?, activated_at = ?
      WHERE daily_loop_id = ?
    `, [isOpen, reason || 'exhausted', tomorrow_micro_action || 'Only do homework for minimum for 2 mins', new Date().toISOString(), loop.id]);

    // Update scoreboard Grit score & student streak status
    await run(`
      UPDATE skill_scoreboards
      SET grit_score = ?, total_daily_score = priority_score + discipline_score + habit_score + grit_score + self_learning_score
      WHERE daily_loop_id = ?
    `, [isOpen, loop.id]);

    await run(`
      UPDATE students
      SET streak_status = ?
      WHERE id = ?
    `, [isOpen ? 'PROTECTED_BY_SAFETY_NET' : 'ACTIVE', student.id]);

    const updatedScoreboard = await get(`SELECT * FROM skill_scoreboards WHERE daily_loop_id = ?`, [loop.id]);

    successResponse(res, {
      safetyNetActive: isOpen === 1,
      streakPreserved: true,
      currentStreak: student.current_streak_days,
      awardedSkills: { grit: isOpen },
      scoreboard: updatedScoreboard
    }, isOpen ? '24h Safety Net Active: Streak protected! Grit point awarded.' : '24h Safety Net closed.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

/* ========================================================
   4. Weekly Review APIs
   ======================================================== */
app.get('/api/v1/weekly-review/current', async (req, res) => {
  try {
    const student = await getCurrentStudent(req);
    const plan = await get(`SELECT * FROM weekly_plans WHERE student_id = ? LIMIT 1`, [student.id]);

    if (!plan) return errorResponse(res, 'No weekly plan found', 404);

    const scheduleBlocks = JSON.parse(plan.schedule_blocks_json || '[]');

    successResponse(res, {
      weekNumber: plan.week_number,
      objectiveStatement: plan.objective_statement,
      keyResults: [plan.key_result_1, plan.key_result_2, plan.key_result_3],
      scheduleBlocks,
      deliberatePracticeFocus: plan.deliberate_practice_focus
    });
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

app.post('/api/v1/weekly-review/finalize', async (req, res) => {
  try {
    const { key_results, deliberate_practice_focus, schedule_blocks } = req.body;
    const student = await getCurrentStudent(req);

    await run(`
      UPDATE weekly_plans
      SET key_result_1 = ?, key_result_2 = ?, key_result_3 = ?, deliberate_practice_focus = ?, schedule_blocks_json = ?
      WHERE student_id = ?
    `, [
      key_results[0] || '',
      key_results[1] || '',
      key_results[2] || '',
      deliberate_practice_focus || '',
      JSON.stringify(schedule_blocks || []),
      student.id
    ]);

    successResponse(res, { success: true }, 'Weekly plan finalized and synchronized.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

/* ========================================================
   5. Onboarding APIs
   ======================================================== */
app.post('/api/v1/onboarding/goal', async (req, res) => {
  try {
    const { subject, baseline_score, target_score, goal_statement, deep_motivation } = req.body;
    const student = await getCurrentStudent(req);

    await run(`
      UPDATE goals_90day
      SET subject = ?, baseline_score = ?, target_score = ?, goal_statement = ?, deep_motivation = ?
      WHERE student_id = ?
    `, [subject, baseline_score, target_score, goal_statement, deep_motivation, student.id]);

    successResponse(res, { nextStep: 'TIME_ALLOCATION' }, '90-Day goal registered.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

app.post('/api/v1/onboarding/time-allocation', async (req, res) => {
  try {
    const { daily_free_time_mins, preferred_focus_slot, focus_duration_mins, schedule_blocks } = req.body;
    const student = await getCurrentStudent(req);

    await run(`
      UPDATE habit_profiles
      SET daily_free_time_mins = ?, preferred_focus_slot = ?, focus_duration_mins = ?
      WHERE student_id = ?
    `, [parseInt(daily_free_time_mins) || 30, preferred_focus_slot, parseInt(focus_duration_mins) || 20, student.id]);

    if (schedule_blocks) {
      await run(`
        UPDATE weekly_plans
        SET schedule_blocks_json = ?
        WHERE student_id = ?
      `, [JSON.stringify(schedule_blocks), student.id]);
    }

    successResponse(res, { nextStep: 'BUILD_HABIT' }, 'Time allocation configured.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

app.post('/api/v1/onboarding/habit', async (req, res) => {
  try {
    const { habit_cue, micro_routine_2min, immediate_reward } = req.body;
    const student = await getCurrentStudent(req);

    await run(`
      UPDATE habit_profiles
      SET habit_cue = ?, micro_routine_2min = ?, immediate_reward = ?
      WHERE student_id = ?
    `, [habit_cue, micro_routine_2min, immediate_reward, student.id]);

    successResponse(res, { completed: true }, 'Habit loop configured. 90-Day Roadmap activated!');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

/* ========================================================
   6. Beta Testing APIs (Skip Day, Jump Day, Reset Day 1)
   ======================================================== */
app.post('/api/v1/beta/skip-day', async (req, res) => {
  try {
    const count = parseInt(req.body.count) || 1;
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);

    let newDay = goal.current_day_number + count;
    if (newDay > 90) newDay = 90;

    let newPhase = 1;
    if (newDay > 60) newPhase = 3;
    else if (newDay > 30) newPhase = 2;

    await run(`
      UPDATE goals_90day
      SET current_day_number = ?, current_phase = ?
      WHERE id = ?
    `, [newDay, newPhase, goal.id]);

    // Reset daily loop state for fresh day testing
    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);
    await run(`
      UPDATE daily_loops
      SET loop_status = 'NOT_STARTED', min_habit_checked = 0
      WHERE id = ?
    `, [loop.id]);

    await run(`
      UPDATE skill_scoreboards
      SET priority_score = 0, discipline_score = 0, habit_score = 0, grit_score = 0, self_learning_score = 0, total_daily_score = 0
      WHERE daily_loop_id = ?
    `, [loop.id]);

    await run(`
      UPDATE grit_safety_events
      SET switch_open = 0
      WHERE daily_loop_id = ?
    `, [loop.id]);

    successResponse(res, {
      currentDay: newDay,
      currentPhase: newPhase,
      streak: student.current_streak_days
    }, `Advanced to Day ${newDay}/90 (Phase ${newPhase})`);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

app.post('/api/v1/beta/jump-day', async (req, res) => {
  try {
    const targetDay = Math.max(1, Math.min(90, parseInt(req.body.targetDay) || 1));
    const student = await getCurrentStudent(req);
    const goal = await get(`SELECT * FROM goals_90day WHERE student_id = ? LIMIT 1`, [student.id]);

    let newPhase = 1;
    if (targetDay > 60) newPhase = 3;
    else if (targetDay > 30) newPhase = 2;

    await run(`
      UPDATE goals_90day
      SET current_day_number = ?, current_phase = ?
      WHERE id = ?
    `, [targetDay, newPhase, goal.id]);

    const loop = await get(`SELECT * FROM daily_loops WHERE goal_id = ? ORDER BY loop_date DESC LIMIT 1`, [goal.id]);
    await run(`
      UPDATE daily_loops
      SET loop_status = 'NOT_STARTED', min_habit_checked = 0
      WHERE id = ?
    `, [loop.id]);

    await run(`
      UPDATE skill_scoreboards
      SET priority_score = 0, discipline_score = 0, habit_score = 0, grit_score = 0, self_learning_score = 0, total_daily_score = 0
      WHERE daily_loop_id = ?
    `, [loop.id]);

    successResponse(res, {
      currentDay: targetDay,
      currentPhase: newPhase
    }, `Jumped to Day ${targetDay}/90 (Phase ${newPhase})`);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

app.post('/api/v1/beta/reset-day1', async (req, res) => {
  try {
    // Re-seed DB to Day 1
    await run(`DELETE FROM skill_scoreboards;`);
    await run(`DELETE FROM grit_safety_events;`);
    await run(`DELETE FROM daily_reflections;`);
    await run(`DELETE FROM focus_sessions;`);
    await run(`DELETE FROM daily_loops;`);
    await run(`DELETE FROM weekly_plans;`);
    await run(`DELETE FROM habit_profiles;`);
    await run(`DELETE FROM goals_90day;`);
    await run(`DELETE FROM students;`);

    await seedDay1();

    successResponse(res, { success: true }, 'Database re-seeded to Day 1 initial state.');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
});

// Start Server after DB initialization
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 SMS - Self Management System Backend Running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`💾 Database: SQLite3 (${path.join(__dirname, 'sms_system.db')})`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
  });
