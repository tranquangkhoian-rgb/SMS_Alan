/**
 * SMS - Self Management System
 * Database Layer (SQLite3)
 * Implements schema defined in Docs/Design_Document_SMS_Alan.md
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'sms_system.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
  }
});

// Run queries with Promise wrapper
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema tables
async function initDb() {
  await run(`PRAGMA foreign_keys = ON;`);

  // 1. Students
  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      current_streak_days INTEGER NOT NULL DEFAULT 0,
      streak_status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_active_date TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 2. 90-Day Goals
  await run(`
    CREATE TABLE IF NOT EXISTS goals_90day (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      baseline_score TEXT NOT NULL,
      target_score TEXT NOT NULL,
      goal_statement TEXT NOT NULL,
      deep_motivation TEXT NOT NULL,
      current_day_number INTEGER NOT NULL DEFAULT 1,
      current_phase INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // 3. Habit Profiles
  await run(`
    CREATE TABLE IF NOT EXISTS habit_profiles (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      habit_cue TEXT NOT NULL,
      micro_routine_2min TEXT NOT NULL,
      immediate_reward TEXT NOT NULL,
      daily_free_time_mins INTEGER NOT NULL DEFAULT 30,
      preferred_focus_slot TEXT NOT NULL DEFAULT '19:45',
      focus_duration_mins INTEGER NOT NULL DEFAULT 20,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // 4. Weekly Plans & Schedule Blocks
  await run(`
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      week_number INTEGER NOT NULL DEFAULT 1,
      objective_statement TEXT NOT NULL,
      key_result_1 TEXT NOT NULL,
      key_result_2 TEXT NOT NULL,
      key_result_3 TEXT NOT NULL,
      deliberate_practice_focus TEXT NOT NULL,
      schedule_blocks_json TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // 5. Daily Loops
  await run(`
    CREATE TABLE IF NOT EXISTS daily_loops (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      loop_date TEXT NOT NULL,
      top1_task TEXT,
      scheduled_time TEXT,
      scheduled_duration_mins INTEGER DEFAULT 20,
      if_trigger TEXT,
      then_action TEXT,
      min_habit_checked INTEGER NOT NULL DEFAULT 0,
      loop_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      FOREIGN KEY (goal_id) REFERENCES goals_90day(id) ON DELETE CASCADE,
      UNIQUE (goal_id, loop_date)
    );
  `);

  // 6. Focus Sessions
  await run(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      daily_loop_id TEXT UNIQUE NOT NULL,
      started_at TEXT,
      ended_at TEXT,
      planned_seconds INTEGER NOT NULL DEFAULT 1200,
      actual_seconds INTEGER NOT NULL DEFAULT 0,
      summary_1sentence TEXT,
      next_step TEXT,
      session_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      FOREIGN KEY (daily_loop_id) REFERENCES daily_loops(id) ON DELETE CASCADE
    );
  `);

  // 7. Daily Reflections
  await run(`
    CREATE TABLE IF NOT EXISTS daily_reflections (
      id TEXT PRIMARY KEY,
      daily_loop_id TEXT UNIQUE NOT NULL,
      intended_outcome TEXT NOT NULL,
      what_happened TEXT NOT NULL,
      tweak_tomorrow TEXT NOT NULL,
      logged_at TEXT,
      FOREIGN KEY (daily_loop_id) REFERENCES daily_loops(id) ON DELETE CASCADE
    );
  `);

  // 8. Grit Safety Events
  await run(`
    CREATE TABLE IF NOT EXISTS grit_safety_events (
      id TEXT PRIMARY KEY,
      daily_loop_id TEXT UNIQUE NOT NULL,
      reason TEXT NOT NULL,
      tomorrow_micro_action TEXT NOT NULL,
      switch_open INTEGER NOT NULL DEFAULT 0,
      activated_at TEXT,
      FOREIGN KEY (daily_loop_id) REFERENCES daily_loops(id) ON DELETE CASCADE
    );
  `);

  // 9. Skill Scoreboards
  await run(`
    CREATE TABLE IF NOT EXISTS skill_scoreboards (
      id TEXT PRIMARY KEY,
      daily_loop_id TEXT UNIQUE NOT NULL,
      priority_score INTEGER NOT NULL DEFAULT 0,
      discipline_score INTEGER NOT NULL DEFAULT 0,
      habit_score INTEGER NOT NULL DEFAULT 0,
      grit_score INTEGER NOT NULL DEFAULT 0,
      self_learning_score INTEGER NOT NULL DEFAULT 0,
      total_daily_score INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (daily_loop_id) REFERENCES daily_loops(id) ON DELETE CASCADE
    );
  `);

  // Seed default Day 1 student and records if table is empty
  const student = await get(`SELECT * FROM students LIMIT 1`);
  if (!student) {
    await seedDay1();
  }
}

async function seedDay1() {
  const today = new Date().toISOString().slice(0, 10);
  const studentId = 'student-alan-001';
  const goalId = 'goal-alan-001';
  const loopId = 'daily-loop-today';

  await run(`
    INSERT INTO students (id, email, full_name, current_streak_days, streak_status, last_active_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [studentId, 'khoian.alan@vinschool.edu.vn', 'Trần Quang Khôi An', 0, 'ACTIVE', today, new Date().toISOString()]);

  await run(`
    INSERT INTO goals_90day (id, student_id, subject, baseline_score, target_score, goal_statement, deep_motivation, current_day_number, current_phase, start_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    goalId,
    studentId,
    'English',
    '9',
    '9.5',
    "Students learn repeatly every day and upgraded their English's score form 9 to 9.5 and talk more confidently.",
    "Because I want to talk more confidently and showed excellent academic results for future exam that i about to get.",
    1,
    1, // Phase 1: Priority & Discipline
    today,
    'IN_PROGRESS'
  ]);

  await run(`
    INSERT INTO habit_profiles (id, student_id, habit_cue, micro_routine_2min, immediate_reward, daily_free_time_mins, preferred_focus_slot, focus_duration_mins, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'habit-alan-001',
    studentId,
    'After school...',
    'Sit at my desk and learn 5 new English words.',
    'Stick a sticker and listen to my favorite song.',
    30,
    '19:45',
    20,
    1
  ]);

  const defaultSchedule = [
    { id: 'sb-1', day: 'Tue', time: '19:45', durationMins: 20 },
    { id: 'sb-2', day: 'Thu', time: '19:45', durationMins: 20 },
    { id: 'sb-3', day: 'Sat', time: '09:30', durationMins: 25 }
  ];

  await run(`
    INSERT INTO weekly_plans (id, student_id, week_number, objective_statement, key_result_1, key_result_2, key_result_3, deliberate_practice_focus, schedule_blocks_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'weekly-plan-w1',
    studentId,
    1,
    'Study regularly every day and improve your English score from 9.0 to 9.5.',
    'Complete 3 English listening tests. (Hoàn thành 3 bài kiểm tra nghe).',
    'Master 3 advanced vocabulary words daily. (Làm chủ 3 từ vựng nâng cao mỗi ngày).',
    'Practice speaking for 15 minutes every morning. (Luyện nói 15 phút mỗi sáng).',
    'Pronunciation: Record my voice and compare it with native speakers to fix ending sounds.',
    JSON.stringify(defaultSchedule)
  ]);

  await run(`
    INSERT INTO daily_loops (id, goal_id, loop_date, top1_task, scheduled_time, scheduled_duration_mins, if_trigger, then_action, min_habit_checked, loop_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    loopId,
    goalId,
    today,
    'Finish English homework and review 5 vocabulary words.',
    '19:45',
    20,
    'want to use phone',
    'Put phone out of reach',
    0,
    'NOT_STARTED'
  ]);

  await run(`
    INSERT INTO focus_sessions (id, daily_loop_id, planned_seconds, actual_seconds, summary_1sentence, next_step, session_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'focus-session-today',
    loopId,
    1200,
    0,
    'Have completed the lesson, learned 5 new words',
    'Next morning, practiced back these 5 words',
    'NOT_STARTED'
  ]);

  await run(`
    INSERT INTO daily_reflections (id, daily_loop_id, intended_outcome, what_happened, tweak_tomorrow, logged_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'reflection-today',
    loopId,
    'Master the grammar of present tense.',
    'Still a few mistakes when conjuncting singular verbs',
    'Read the subject carefully before filling in the answer',
    ''
  ]);

  await run(`
    INSERT INTO grit_safety_events (id, daily_loop_id, reason, tomorrow_micro_action, switch_open, activated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'grit-today',
    loopId,
    'exhausted',
    'Only do homework for minimum for 2 mins',
    0,
    ''
  ]);

  await run(`
    INSERT INTO skill_scoreboards (id, daily_loop_id, priority_score, discipline_score, habit_score, grit_score, self_learning_score, total_daily_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'scoreboard-today',
    loopId,
    0,
    0,
    0,
    0,
    0,
    0
  ]);

  console.log('Seeded initial Day 1 student profile into SQLite.');
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb,
  seedDay1
};
