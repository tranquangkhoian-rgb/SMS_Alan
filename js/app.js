/**
 * SMS - Self Management System
 * Main Application Controller
 * Handles Navigation, State Management, Custom Editable Timers, Editable Schedules,
 * 5-Skill Scoreboard, 24h Safety Net, and Beta Testing Day Skipping.
 */

class AppController {
  constructor() {
    this.state = window.smsStorage.loadState();
    this.timerWorker = null;
    this.timerDuration = (this.state.focusSession && this.state.focusSession.plannedSeconds) || 1200;
    this.remainingSeconds = this.timerDuration;
    this.timerState = 'STOPPED'; // 'STOPPED', 'RUNNING', 'PAUSED'
  }

  init() {
    // Ensure schedule blocks exist
    if (!this.state.weeklyPlan.scheduleBlocks || this.state.weeklyPlan.scheduleBlocks.length === 0) {
      this.state.weeklyPlan.scheduleBlocks = JSON.parse(JSON.stringify(window.SMS_MODELS.DEFAULT_SCHEDULE_BLOCKS));
    }

    this.initTimerWorker();
    this.bindEvents();
    this.render();
    this.syncWithBackend();
  }

  async syncWithBackend() {
    if (window.smsApiClient) {
      const isOnline = await window.smsApiClient.checkHealth();
      const badge = document.getElementById('backend-status-badge');
      if (badge) {
        if (isOnline) {
          badge.textContent = '🟢 Backend: SQLite3 Online';
          badge.className = 'status-online';
          // Optionally hydrate from SQLite
          const summary = await window.smsApiClient.getDashboardSummary();
          if (summary && summary.roadmap) {
            this.state.goal.currentDayNumber = summary.roadmap.currentDay;
            this.state.goal.currentPhase = summary.roadmap.phaseNumber;
            this.state.student.currentStreakDays = summary.student.streakDays;
            this.render();
          }
        } else {
          badge.textContent = '🟡 Storage: Local';
          badge.className = 'status-offline';
        }
      }
    }
  }

  /* ================== TIMER & WEB WORKER ================== */
  initTimerWorker() {
    const workerScript = `
      let timerInterval = null;
      let endTime = null;
      let remaining = 0;
      let isPaused = false;

      self.onmessage = function(e) {
        const data = e.data;
        if (data.action === 'START') {
          if (timerInterval) clearInterval(timerInterval);
          remaining = data.duration;
          endTime = Date.now() + remaining * 1000;
          isPaused = false;
          timerInterval = setInterval(() => {
            if (isPaused) return;
            const now = Date.now();
            const diff = Math.round((endTime - now) / 1000);
            if (diff <= 0) {
              clearInterval(timerInterval);
              timerInterval = null;
              self.postMessage({ action: 'TICK', remaining: 0 });
              self.postMessage({ action: 'COMPLETE' });
            } else {
              remaining = diff;
              self.postMessage({ action: 'TICK', remaining: diff });
            }
          }, 1000);
        } else if (data.action === 'PAUSE') {
          isPaused = true;
          if (timerInterval) clearInterval(timerInterval);
          timerInterval = null;
          self.postMessage({ action: 'PAUSED', remaining });
        } else if (data.action === 'RESUME') {
          if (remaining > 0) {
            endTime = Date.now() + remaining * 1000;
            isPaused = false;
            timerInterval = setInterval(() => {
              if (isPaused) return;
              const now = Date.now();
              const diff = Math.round((endTime - now) / 1000);
              if (diff <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                self.postMessage({ action: 'TICK', remaining: 0 });
                self.postMessage({ action: 'COMPLETE' });
              } else {
                remaining = diff;
                self.postMessage({ action: 'TICK', remaining: diff });
              }
            }, 1000);
          }
        } else if (data.action === 'RESET') {
          if (timerInterval) clearInterval(timerInterval);
          timerInterval = null;
          remaining = data.duration;
          self.postMessage({ action: 'RESET', remaining });
        }
      };
    `;

    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.timerWorker = new Worker(workerUrl);

      this.timerWorker.onmessage = (e) => {
        const msg = e.data;
        if (msg.action === 'TICK') {
          this.remainingSeconds = msg.remaining;
          this.updateTimerDisplay(msg.remaining);
        } else if (msg.action === 'COMPLETE') {
          this.timerState = 'STOPPED';
          this.updateTimerControls();
          window.smsAudio.playCompletionChime();
          this.showToast('🎉 Focus Session Completed! Summarize your win below.');
        } else if (msg.action === 'PAUSED') {
          this.timerState = 'PAUSED';
          this.updateTimerControls();
        } else if (msg.action === 'RESET') {
          this.timerState = 'STOPPED';
          this.remainingSeconds = msg.remaining;
          this.updateTimerDisplay(msg.remaining);
          this.updateTimerControls();
        }
      };
    } catch (e) {
      console.warn('Web Worker fallback:', e);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateTimerDisplay(seconds) {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = this.formatTime(seconds);
    }
  }

  updateTimerControls() {
    const startBtn = document.getElementById('btn-timer-start-pause');
    if (!startBtn) return;

    if (this.timerState === 'RUNNING') {
      startBtn.textContent = 'Pause';
      startBtn.className = 'btn-canva';
    } else if (this.timerState === 'PAUSED') {
      startBtn.textContent = 'Resume';
      startBtn.className = 'btn-canva btn-canva-primary';
    } else {
      startBtn.textContent = 'Start';
      startBtn.className = 'btn-canva btn-canva-primary';
    }
  }

  setTimerMinutes(minutes) {
    const parsed = parseInt(minutes);
    const validMins = Math.max(1, Math.min(180, isNaN(parsed) ? 20 : parsed));
    this.timerDuration = validMins * 60;
    this.remainingSeconds = this.timerDuration;
    this.state.focusSession.plannedSeconds = this.timerDuration;
    this.state.dailyLoop.scheduledDurationMins = validMins;

    const banner = document.getElementById('timer-meta-banner');
    if (banner) {
      banner.textContent = `${this.state.dailyLoop.top1Task} | Start: ${this.state.dailyLoop.scheduledTime} | Goal: ${validMins} min`;
    }

    const customInput = document.getElementById('input-custom-mins');
    if (customInput) customInput.value = validMins;

    const planDuration = document.getElementById('daily-input-duration');
    if (planDuration) planDuration.value = validMins;

    if (this.timerWorker) {
      this.timerWorker.postMessage({ action: 'RESET', duration: this.timerDuration });
    }
    this.timerState = 'STOPPED';
    this.updateTimerDisplay(this.remainingSeconds);
    this.updateTimerControls();
    window.smsStorage.saveState(this.state);
    this.showToast(`⏱️ Timer adjusted to ${validMins} minutes.`);
  }

  adjustTimerMinutes(delta) {
    const currentMins = Math.round(this.timerDuration / 60);
    this.setTimerMinutes(currentMins + delta);
  }

  /* ================== NAVIGATION & ROUTING ================== */
  switchTab(tabName) {
    this.state.activeTab = tabName;
    window.smsStorage.saveState(this.state);

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.style.display = 'none';
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
      targetView.style.display = 'block';
      targetView.classList.add('active');
    }

    this.render();
  }

  switchDailyStep(step) {
    this.state.dailyStep = step;
    window.smsStorage.saveState(this.state);

    document.getElementById('step-btn-plan').classList.toggle('active', step === 'plan');
    document.getElementById('step-btn-timer').classList.toggle('active', step === 'timer');
    document.getElementById('step-btn-end').classList.toggle('active', step === 'end-day');

    document.getElementById('daily-step-plan-card').style.display = (step === 'plan') ? 'block' : 'none';
    document.getElementById('daily-step-timer-card').style.display = (step === 'timer') ? 'block' : 'none';
    document.getElementById('daily-step-end-card').style.display = (step === 'end-day') ? 'block' : 'none';

    if (step === 'timer') {
      this.updateTimerDisplay(this.remainingSeconds);
      const banner = document.getElementById('timer-meta-banner');
      if (banner) {
        banner.textContent = `${this.state.dailyLoop.top1Task} | Start: ${this.state.dailyLoop.scheduledTime} | Goal: ${this.state.dailyLoop.scheduledDurationMins} min`;
      }
    }
    this.render();
  }

  switchOnboardingStep(stepNumber) {
    document.getElementById('onboarding-step-1').style.display = (stepNumber === 1) ? 'block' : 'none';
    document.getElementById('onboarding-step-2').style.display = (stepNumber === 2) ? 'block' : 'none';
    document.getElementById('onboarding-step-3').style.display = (stepNumber === 3) ? 'block' : 'none';
    if (stepNumber === 2) {
      this.renderOnboardingSchedule();
    }
  }

  /* ================== BETA TESTING & DAY SKIPPING ================== */
  advanceDay(count = 1) {
    let newDay = this.state.goal.currentDayNumber + count;
    if (newDay > 90) {
      newDay = 90;
      this.showToast('🎓 Congratulations! You reached Day 90 / 90 of the SMS program!');
    }

    const previousPhase = this.state.goal.currentPhase;
    this.state.goal.currentDayNumber = newDay;

    // Recalculate Phase based on scientific roadmap
    if (newDay <= 30) {
      this.state.goal.currentPhase = 1; // Priority & Discipline
    } else if (newDay <= 60) {
      this.state.goal.currentPhase = 2; // Habit + Grit
    } else {
      this.state.goal.currentPhase = 3; // Mastery & Self-Learning
    }

    // Phase transition notification
    if (this.state.goal.currentPhase !== previousPhase) {
      const phaseNames = ['', 'Phase 1: Priority & Discipline', 'Phase 2: Habit + Grit', 'Phase 3: Mastery & Self-Learning'];
      this.showToast(`🌟 Milestone Unlocked! Advanced to ${phaseNames[this.state.goal.currentPhase]}`);
    } else {
      this.showToast(`⏩ Advanced to Day ${newDay}/90`);
    }

    // Reset daily loop state for fresh new day testing
    this.state.dailyLoop.minHabitChecked = false;
    this.state.dailyLoop.loopStatus = 'NOT_STARTED';
    this.state.scoreboard.priorityScore = 0;
    this.state.scoreboard.disciplineScore = 0;
    this.state.scoreboard.habitScore = 0;
    this.state.scoreboard.gritScore = 0;
    this.state.scoreboard.selfLearningScore = 0;
    this.state.gritSafety.switchOpen = false;

    window.smsStorage.saveState(this.state);
    if (window.smsApiClient) {
      window.smsApiClient.skipDay(count);
    }
    this.render();
  }

  jumpToSpecificDay(targetDay) {
    const day = Math.max(1, Math.min(90, parseInt(targetDay) || 1));
    this.state.goal.currentDayNumber = day;
    if (day <= 30) {
      this.state.goal.currentPhase = 1;
    } else if (day <= 60) {
      this.state.goal.currentPhase = 2;
    } else {
      this.state.goal.currentPhase = 3;
    }

    this.state.dailyLoop.minHabitChecked = false;
    this.state.dailyLoop.loopStatus = 'NOT_STARTED';
    this.state.scoreboard.priorityScore = 0;
    this.state.scoreboard.disciplineScore = 0;
    this.state.scoreboard.habitScore = 0;
    this.state.scoreboard.gritScore = 0;
    this.state.scoreboard.selfLearningScore = 0;
    this.state.gritSafety.switchOpen = false;

    window.smsStorage.saveState(this.state);
    if (window.smsApiClient) {
      window.smsApiClient.jumpDay(day);
    }
    this.render();
    this.showToast(`🎯 Jumped to Day ${day}/90 (Phase ${this.state.goal.currentPhase})`);
  }

  /* ================== EDITABLE SCHEDULE MANAGEMENT ================== */
  renderWeeklySchedule() {
    const container = document.getElementById('weekly-schedule-container');
    if (!container) return;

    container.innerHTML = '';
    const blocks = this.state.weeklyPlan.scheduleBlocks || [];

    blocks.forEach((block, index) => {
      const row = document.createElement('div');
      row.className = 'schedule-row';
      row.innerHTML = `
        <select class="schedule-select-day" data-idx="${index}">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon-Fri'].map(d => 
            `<option value="${d}" ${block.day === d ? 'selected' : ''}>${d}</option>`
          ).join('')}
        </select>
        <input type="time" class="schedule-input-time" data-idx="${index}" value="${block.time}" />
        <div style="display: flex; align-items: center; gap: 4px;">
          <input type="number" min="5" max="180" class="schedule-input-duration" data-idx="${index}" value="${block.durationMins}" />
          <span style="font-size: 13px; font-weight: 600;">min</span>
        </div>
        <button type="button" class="btn-delete-row" data-idx="${index}" title="Remove slot">✕</button>
      `;
      container.appendChild(row);
    });

    // Bind change listeners to schedule rows
    container.querySelectorAll('.schedule-select-day').forEach(select => {
      select.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].day = e.target.value;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.schedule-input-time').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].time = e.target.value;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.schedule-input-duration').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].durationMins = parseInt(e.target.value) || 20;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks.splice(idx, 1);
        window.smsStorage.saveState(this.state);
        this.renderWeeklySchedule();
      });
    });
  }

  renderOnboardingSchedule() {
    const container = document.getElementById('onboarding-schedule-container');
    if (!container) return;

    container.innerHTML = '';
    const blocks = this.state.weeklyPlan.scheduleBlocks || [];

    blocks.forEach((block, index) => {
      const row = document.createElement('div');
      row.className = 'schedule-row';
      row.innerHTML = `
        <select class="schedule-select-day" data-idx="${index}">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon-Fri'].map(d => 
            `<option value="${d}" ${block.day === d ? 'selected' : ''}>${d}</option>`
          ).join('')}
        </select>
        <input type="time" class="schedule-input-time" data-idx="${index}" value="${block.time}" />
        <div style="display: flex; align-items: center; gap: 4px;">
          <input type="number" min="5" max="180" class="schedule-input-duration" data-idx="${index}" value="${block.durationMins}" />
          <span style="font-size: 13px; font-weight: 600;">min</span>
        </div>
        <button type="button" class="btn-delete-row" data-idx="${index}" title="Remove slot">✕</button>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.schedule-select-day').forEach(select => {
      select.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].day = e.target.value;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.schedule-input-time').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].time = e.target.value;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.schedule-input-duration').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks[idx].durationMins = parseInt(e.target.value) || 20;
        window.smsStorage.saveState(this.state);
      });
    });

    container.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.idx;
        this.state.weeklyPlan.scheduleBlocks.splice(idx, 1);
        window.smsStorage.saveState(this.state);
        this.renderOnboardingSchedule();
      });
    });
  }

  addScheduleBlock() {
    const newBlock = {
      id: 'sb-' + Date.now(),
      day: 'Mon',
      time: '19:45',
      durationMins: 20
    };
    this.state.weeklyPlan.scheduleBlocks.push(newBlock);
    window.smsStorage.saveState(this.state);
    this.renderWeeklySchedule();
    this.renderOnboardingSchedule();
    this.showToast('➕ Added focus block to schedule');
  }

  /* ================== EVENT BINDINGS ================== */
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchTab(item.dataset.tab);
      });
    });

    // Beta Testing Tools
    const skipBtn = document.getElementById('btn-skip-day');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.advanceDay(1);
      });
    }

    const jumpBtn = document.getElementById('btn-jump-day');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        const input = document.getElementById('input-jump-day');
        if (input) this.jumpToSpecificDay(input.value);
      });
    }

    // Reset Buttons
    document.getElementById('btn-load-day1').addEventListener('click', () => {
      this.state = window.smsStorage.resetToDay1();
      this.timerDuration = 1200;
      this.remainingSeconds = 1200;
      this.switchTab('dashboard');
      this.showToast('🌱 Initialized Day 1 / 90 (Priority & Discipline)');
    });

    document.getElementById('btn-reset-fresh').addEventListener('click', () => {
      this.state = window.smsStorage.resetToFresh();
      this.switchTab('goals');
      this.switchOnboardingStep(1);
      this.showToast('🔄 Initialized fresh onboarding wizard.');
    });

    // Dashboard Buttons
    document.getElementById('dash-btn-plan').addEventListener('click', () => {
      this.switchTab('daily-loop');
      this.switchDailyStep('plan');
    });

    document.getElementById('dash-btn-start-focus').addEventListener('click', () => {
      this.switchTab('daily-loop');
      this.switchDailyStep('timer');
      this.startTimer();
    });

    // Timer Edit Controls
    document.getElementById('btn-timer-quick-1m').addEventListener('click', () => this.setTimerMinutes(1));
    document.getElementById('btn-timer-quick-5m').addEventListener('click', () => this.setTimerMinutes(5));
    document.getElementById('btn-timer-quick-15m').addEventListener('click', () => this.setTimerMinutes(15));
    document.getElementById('btn-timer-quick-20m').addEventListener('click', () => this.setTimerMinutes(20));
    document.getElementById('btn-timer-quick-25m').addEventListener('click', () => this.setTimerMinutes(25));
    document.getElementById('btn-timer-sub-5m').addEventListener('click', () => this.adjustTimerMinutes(-5));
    document.getElementById('btn-timer-add-5m').addEventListener('click', () => this.adjustTimerMinutes(5));

    document.getElementById('btn-set-custom-timer').addEventListener('click', () => {
      const input = document.getElementById('input-custom-mins');
      if (input) this.setTimerMinutes(input.value);
    });

    // Schedule Add Block Buttons
    const weeklyAddBtn = document.getElementById('btn-weekly-add-block');
    if (weeklyAddBtn) {
      weeklyAddBtn.addEventListener('click', () => this.addScheduleBlock());
    }

    const onbAddBtn = document.getElementById('btn-onboarding-add-slot');
    if (onbAddBtn) {
      onbAddBtn.addEventListener('click', () => this.addScheduleBlock());
    }

    // Onboarding Wizard Buttons
    document.getElementById('btn-onboarding-next-1').addEventListener('click', () => {
      this.state.goal.goalStatement = document.getElementById('goal-input-statement').value;
      this.state.goal.subject = document.getElementById('goal-input-subject').value;
      this.state.goal.baselineScore = document.getElementById('goal-input-baseline').value;
      this.state.goal.targetScore = document.getElementById('goal-input-target').value;
      this.state.goal.deepMotivation = document.getElementById('goal-input-motivation').value;
      window.smsStorage.saveState(this.state);
      this.switchOnboardingStep(2);
    });

    document.getElementById('btn-onboarding-back-2').addEventListener('click', () => {
      this.switchOnboardingStep(1);
    });

    document.getElementById('btn-onboarding-next-2').addEventListener('click', () => {
      this.state.habit.dailyFreeTimeMins = parseInt(document.getElementById('time-input-freetime').value) || 30;
      this.state.habit.preferredFocusSlot = document.getElementById('time-input-slot').value;
      const dur = parseInt(document.getElementById('time-input-duration').value) || 20;
      this.state.habit.focusDurationMins = dur;
      this.setTimerMinutes(dur);
      window.smsStorage.saveState(this.state);
      this.switchOnboardingStep(3);
    });

    document.getElementById('btn-onboarding-back-3').addEventListener('click', () => {
      this.switchOnboardingStep(2);
    });

    document.getElementById('btn-onboarding-finish-3').addEventListener('click', () => {
      this.state.habit.habitCue = document.getElementById('habit-input-cue').value;
      this.state.habit.microRoutine2min = document.getElementById('habit-input-routine').value;
      this.state.habit.immediateReward = document.getElementById('habit-input-reward').value;
      this.state.isOnboarded = true;
      window.smsStorage.saveState(this.state);
      this.showToast('🚀 90-Day Roadmap Activated! Welcome to Day 1.');
      this.switchTab('dashboard');
    });

    // Daily Loop Sub-stepper header
    document.getElementById('step-btn-plan').addEventListener('click', () => this.switchDailyStep('plan'));
    document.getElementById('step-btn-timer').addEventListener('click', () => this.switchDailyStep('timer'));
    document.getElementById('step-btn-end').addEventListener('click', () => this.switchDailyStep('end-day'));

    // Step 1: Plan
    document.getElementById('btn-daily-start-focus').addEventListener('click', () => {
      this.state.dailyLoop.top1Task = document.getElementById('daily-input-top1').value;
      this.state.dailyLoop.scheduledTime = document.getElementById('daily-input-start-time').value;
      const plannedMins = parseInt(document.getElementById('daily-input-duration').value) || 20;
      this.state.dailyLoop.scheduledDurationMins = plannedMins;
      this.setTimerMinutes(plannedMins);

      this.state.dailyLoop.ifTrigger = document.getElementById('daily-input-if').value;
      this.state.dailyLoop.thenAction = document.getElementById('daily-input-then').value;
      const minChecked = document.getElementById('check-min-habit').checked;
      this.state.dailyLoop.minHabitChecked = minChecked;

      this.state.scoreboard.priorityScore = 1;
      if (minChecked) {
        this.state.scoreboard.disciplineScore = 1;
      }
      this.state.dailyLoop.loopStatus = 'PLANNED';
      window.smsStorage.saveState(this.state);

      if (window.smsApiClient) {
        window.smsApiClient.submitPlan({
          top1_task: this.state.dailyLoop.top1Task,
          scheduled_time: this.state.dailyLoop.scheduledTime,
          duration_mins: plannedMins,
          if_trigger: this.state.dailyLoop.ifTrigger,
          then_action: this.state.dailyLoop.thenAction,
          min_habit_completed: minChecked
        });
      }

      this.switchDailyStep('timer');
      this.startTimer();
      this.showToast('🎯 Priority locked! Focus timer started.');
    });

    // Step 2: Timer controls
    document.getElementById('btn-timer-start-pause').addEventListener('click', () => {
      if (this.timerState === 'RUNNING') {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    });

    document.getElementById('btn-timer-reset').addEventListener('click', () => {
      this.resetTimer();
    });

    document.getElementById('btn-finish-focus').addEventListener('click', () => {
      this.state.focusSession.summary1Sentence = document.getElementById('timer-input-summary').value;
      this.state.focusSession.nextStep = document.getElementById('timer-input-nextstep').value;
      this.state.scoreboard.habitScore = 1;
      this.state.dailyLoop.loopStatus = 'FOCUSED';
      window.smsStorage.saveState(this.state);

      if (window.smsApiClient) {
        window.smsApiClient.finishFocus({
          actual_seconds: this.timerDuration,
          summary_1sentence: this.state.focusSession.summary1Sentence,
          next_step: this.state.focusSession.nextStep
        });
      }

      this.switchDailyStep('end-day');
      this.showToast('✅ Focus logged! Proceeding to End Day Reflection.');
    });

    // Step 3: End Day & 24h Safety Net
    document.getElementById('btn-safety-switch').addEventListener('click', () => {
      this.state.gritSafety.switchOpen = !this.state.gritSafety.switchOpen;
      const details = document.getElementById('safety-net-details');
      const switchBtn = document.getElementById('btn-safety-switch');

      if (this.state.gritSafety.switchOpen) {
        switchBtn.textContent = '[ SWITCH: OPEN ]';
        switchBtn.className = 'switch-btn open';
        details.style.display = 'block';
        this.state.scoreboard.gritScore = 1;
        this.state.student.streakStatus = 'PROTECTED_BY_SAFETY_NET';
        this.showToast('🛡️ 24h Safety Net Open: Grit point awarded & streak protected!');
      } else {
        switchBtn.textContent = '[ SWITCH: CLOSED ]';
        switchBtn.className = 'switch-btn closed';
        details.style.display = 'none';
        this.state.scoreboard.gritScore = 0;
        this.state.student.streakStatus = 'ACTIVE';
      }
      window.smsStorage.saveState(this.state);

      if (window.smsApiClient) {
        window.smsApiClient.activateSafetyNet({
          switch_open: this.state.gritSafety.switchOpen,
          reason: document.getElementById('safety-input-reason').value,
          tomorrow_micro_action: document.getElementById('safety-input-action').value
        });
      }

      this.renderScoreboardRecap();
    });

    document.getElementById('btn-save-finish-day').addEventListener('click', () => {
      this.state.dailyReflection.intendedOutcome = document.getElementById('refl-input-intended').value;
      this.state.dailyReflection.whatHappened = document.getElementById('refl-input-happened').value;
      this.state.dailyReflection.tweakTomorrow = document.getElementById('refl-input-tweak').value;
      this.state.dailyReflection.loggedAt = new Date().toISOString();

      if (this.state.dailyReflection.intendedOutcome.trim().length > 0) {
        this.state.scoreboard.selfLearningScore = 1;
      }

      if (this.state.scoreboard.habitScore === 1 || this.state.gritSafety.switchOpen) {
        this.state.student.currentStreakDays += 1;
      }

      this.state.dailyLoop.loopStatus = 'COMPLETED';
      window.smsStorage.saveState(this.state);

      if (window.smsApiClient) {
        window.smsApiClient.submitEndDay({
          intended_outcome: this.state.dailyReflection.intendedOutcome,
          what_happened: this.state.dailyReflection.whatHappened,
          tweak_tomorrow: this.state.dailyReflection.tweakTomorrow
        });
      }

      this.showToast('🎉 Daily Loop Completed! Progress saved.');
      this.switchTab('dashboard');
    });

    // Weekly Review Finalize
    document.getElementById('btn-finalize-weekly').addEventListener('click', () => {
      this.state.weeklyPlan.keyResults[0] = document.getElementById('weekly-kr-1').value;
      this.state.weeklyPlan.keyResults[1] = document.getElementById('weekly-kr-2').value;
      this.state.weeklyPlan.keyResults[2] = document.getElementById('weekly-kr-3').value;
      this.state.weeklyPlan.deliberatePracticeFocus = document.getElementById('weekly-deliberate-focus').value;
      window.smsStorage.saveState(this.state);

      if (window.smsApiClient) {
        window.smsApiClient.finalizeWeekly({
          key_results: this.state.weeklyPlan.keyResults,
          deliberate_practice_focus: this.state.weeklyPlan.deliberatePracticeFocus,
          schedule_blocks: this.state.weeklyPlan.scheduleBlocks
        });
      }

      this.showToast('📅 Weekly Plan committed and synchronized!');
      this.switchTab('dashboard');
    });
  }

  /* ================== TIMER ACTIONS ================== */
  startTimer() {
    window.smsAudio.init();
    if (this.timerWorker) {
      if (this.timerState === 'PAUSED') {
        this.timerWorker.postMessage({ action: 'RESUME' });
      } else {
        this.timerWorker.postMessage({ action: 'START', duration: this.remainingSeconds });
      }
    }
    this.timerState = 'RUNNING';
    this.updateTimerControls();
  }

  pauseTimer() {
    if (this.timerWorker) {
      this.timerWorker.postMessage({ action: 'PAUSE' });
    }
    this.timerState = 'PAUSED';
    this.updateTimerControls();
  }

  resetTimer() {
    this.remainingSeconds = this.timerDuration;
    if (this.timerWorker) {
      this.timerWorker.postMessage({ action: 'RESET', duration: this.timerDuration });
    }
    this.timerState = 'STOPPED';
    this.updateTimerDisplay(this.remainingSeconds);
    this.updateTimerControls();
  }

  /* ================== UI RENDERING ================== */
  render() {
    // Top Bar Indicators
    const streakEl = document.getElementById('top-streak-display');
    if (streakEl) {
      streakEl.textContent = `🔥 Streak: ${this.state.student.currentStreakDays} days`;
    }

    const phaseEl = document.getElementById('top-phase-indicator');
    if (phaseEl) {
      const phaseNames = ['', 'Priority & Discipline', 'Habit + Grit', 'Mastery & Self-Learning'];
      const phaseNum = this.state.goal.currentPhase;
      phaseEl.textContent = `Day ${this.state.goal.currentDayNumber}/90 | Phase ${phaseNum}: ${phaseNames[phaseNum] || ''}`;
    }

    const jumpInput = document.getElementById('input-jump-day');
    if (jumpInput) {
      jumpInput.value = this.state.goal.currentDayNumber;
    }

    // Dashboard Banner & Task
    const bannerEl = document.getElementById('dash-program-banner');
    if (bannerEl) {
      const phaseNames = ['', 'Phase 1 (Days 1-30): Priority & Discipline', 'Phase 2 (Days 31-60): Habit + Grit', 'Phase 3 (Days 61-90): Mastery & Self-Learning'];
      bannerEl.textContent = `90-Day Program: Day ${this.state.goal.currentDayNumber}/90 ${phaseNames[this.state.goal.currentPhase] || ''}`;
    }

    const dashTaskEl = document.getElementById('dash-top1-task');
    if (dashTaskEl) {
      dashTaskEl.textContent = this.state.dailyLoop.top1Task;
    }

    const dashTimeEl = document.getElementById('dash-focus-time');
    if (dashTimeEl) {
      dashTimeEl.textContent = `${this.state.dailyLoop.scheduledTime} (${this.state.dailyLoop.scheduledDurationMins} mins)`;
    }

    // Render 5-Skill Scoreboard on Dashboard
    this.renderScoreboard();

    // Render End Day Recap
    this.renderScoreboardRecap();

    // Streak status in End Day
    const endStreakEl = document.getElementById('end-streak-status');
    if (endStreakEl) {
      endStreakEl.textContent = `Streak: ${this.state.student.currentStreakDays} days`;
    }

    // Render Schedule lists
    this.renderWeeklySchedule();
  }

  renderScoreboard() {
    const p = this.state.scoreboard.priorityScore;
    const d = this.state.scoreboard.disciplineScore;
    const h = this.state.scoreboard.habitScore;
    const g = this.state.scoreboard.gritScore;
    const s = this.state.scoreboard.selfLearningScore;

    const updateTag = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = `${val}/1`;
        el.className = val === 1 ? 'score-val-1' : 'score-val-0';
      }
    };

    updateTag('score-p', p);
    updateTag('score-d', d);
    updateTag('score-h', h);
    updateTag('score-g', g);
    updateTag('score-s', s);
  }

  renderScoreboardRecap() {
    const recapEl = document.getElementById('end-scoreboard-recap');
    if (recapEl) {
      const p = this.state.scoreboard.priorityScore;
      const d = this.state.scoreboard.disciplineScore;
      const h = this.state.scoreboard.habitScore;
      const g = this.state.scoreboard.gritScore;
      const s = this.state.scoreboard.selfLearningScore;
      recapEl.innerHTML = `Scoreboard Recap : Priority: <strong>${p}/1</strong> | Discipline: <strong>${d}/1</strong> | Habit: <strong>${h}/1</strong> | Grit (Reset): <strong>${g}/1</strong> | Self-learning: <strong>${s}/1</strong>`;
    }
  }

  showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3200);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.smsApp = new AppController();
  window.smsApp.init();
});
