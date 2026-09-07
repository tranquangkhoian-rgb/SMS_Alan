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
    this.selectedAvatar = (this.state.student && this.state.student.avatarUrl) || '🧑‍🎓';

    // Synchronize apiClient user tracking with loaded state
    if (window.smsApiClient) {
      if (this.state.student && !this.state.student.isGuest && this.state.student.id) {
        window.smsApiClient.setUserId(this.state.student.id);
      } else {
        window.smsApiClient.setUserId(null);
      }
    }
  }

  init() {
    // Ensure schedule blocks exist
    if (!this.state.weeklyPlan.scheduleBlocks || this.state.weeklyPlan.scheduleBlocks.length === 0) {
      this.state.weeklyPlan.scheduleBlocks = JSON.parse(JSON.stringify(window.SMS_MODELS.DEFAULT_SCHEDULE_BLOCKS));
    }

    this.initTimerWorker();
    this.bindEvents();
    this.initProfileAndAuth();
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

          // If current user is a guest, keep blank local state instead of overwriting with Alan's seed data
          if (this.state.student && this.state.student.isGuest) {
            this.render();
            return;
          }

          if (this.state.student && this.state.student.id) {
            window.smsApiClient.setUserId(this.state.student.id);
          }

          // Hydrate user profile from SQLite ONLY if matching current active student ID
          const me = await window.smsApiClient.getMe(this.state.student ? this.state.student.id : null);
          if (me && me.id === this.state.student.id) {
            if (me.fullName) this.state.student.fullName = me.fullName;
            if (me.email) this.state.student.email = me.email;
            if (me.avatarUrl) {
              this.state.student.avatarUrl = me.avatarUrl;
              this.selectedAvatar = me.avatarUrl;
            }
            if (me.description) this.state.student.description = me.description;
            if (me.abilitiesHax && me.abilitiesHax.length > 0) this.state.student.abilitiesHax = me.abilitiesHax;
            if (me.streakDays !== undefined) this.state.student.currentStreakDays = me.streakDays;
            if (me.streakStatus) this.state.student.streakStatus = me.streakStatus;
            if (me.habit) {
              if (me.habit.habitCue) this.state.habit.habitCue = me.habit.habitCue;
              if (me.habit.microRoutine2min) this.state.habit.microRoutine2min = me.habit.microRoutine2min;
              if (me.habit.immediateReward) this.state.habit.immediateReward = me.habit.immediateReward;
            }
          }

          const summary = await window.smsApiClient.getDashboardSummary();
          if (summary && summary.roadmap) {
            this.state.goal.currentDayNumber = summary.roadmap.currentDay;
            this.state.goal.currentPhase = summary.roadmap.phaseNumber;
            if (summary.student && summary.student.id === this.state.student.id) {
              this.state.student.currentStreakDays = summary.student.streakDays;
            }
          }
          this.render();
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

    // Reset & Template Buttons
    const btnGuest = document.getElementById('btn-load-guest') || document.getElementById('btn-load-day1');
    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        this.state = window.smsStorage.resetToGuest();
        this.timerDuration = 1200;
        this.remainingSeconds = 1200;
        this.resetTimer();
        this.switchTab('dashboard');
        this.render();
        this.showToast('🌱 Initialized clean blank Guest mode!');
      });
    }

    const btnAlan = document.getElementById('btn-load-alan');
    if (btnAlan) {
      btnAlan.addEventListener('click', () => {
        this.state = window.smsStorage.loadAlanDemo();
        this.timerDuration = 1200;
        this.remainingSeconds = 1200;
        this.resetTimer();
        this.switchTab('dashboard');
        this.render();
        this.showToast('🧑‍🎓 Loaded Alan\'s prefilled demo template!');
      });
    }

    const btnResetFresh = document.getElementById('btn-reset-fresh');
    if (btnResetFresh) {
      btnResetFresh.addEventListener('click', () => {
        this.state = window.smsStorage.resetToFresh();
        this.switchTab('goals');
        this.switchOnboardingStep(1);
        this.showToast('🔄 Initialized fresh onboarding wizard.');
      });
    }

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

    // Render Student Profile & Hero Card
    this.renderStudentProfile();
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

  /* ================== USER PROFILE & AUTHENTICATION ================== */
  renderAvatarContent(avatar) {
    if (!avatar) return '🧑‍🎓';
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image')) {
      return `<img src="${avatar}" alt="Avatar" />`;
    }
    return avatar;
  }

  renderStudentProfile() {
    const student = this.state.student || {};
    const habit = this.state.habit || {};

    // Top Bar Chip
    const chipAvatar = document.getElementById('chip-avatar');
    if (chipAvatar) chipAvatar.innerHTML = this.renderAvatarContent(student.avatarUrl || (student.isGuest ? '👤' : '🧑‍🎓'));

    const chipName = document.getElementById('chip-name');
    if (chipName) chipName.textContent = student.fullName || (student.isGuest ? 'Guest User' : 'Student');

    const chipMode = document.getElementById('chip-mode-badge');
    if (chipMode) {
      if (student.isGuest) {
        chipMode.textContent = '🟡 Mode: Guest';
        chipMode.className = 'badge-guest';
      } else {
        chipMode.textContent = '🟢 Mode: Account';
        chipMode.className = 'badge-guest mode-account';
      }
    }

    const btnAuth = document.getElementById('btn-open-auth');
    if (btnAuth) {
      btnAuth.textContent = student.isGuest ? '🔑 Log In / Create Account' : '👤 Switch / Account';
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.style.display = student.isGuest ? 'none' : 'inline-flex';
    }

    // Dashboard Hero Card
    const dashAvatar = document.getElementById('dash-avatar');
    if (dashAvatar) dashAvatar.innerHTML = this.renderAvatarContent(student.avatarUrl || (student.isGuest ? '👤' : '🧑‍🎓'));

    const dashName = document.getElementById('dash-student-name');
    if (dashName) dashName.textContent = student.fullName || (student.isGuest ? 'Guest User' : 'Student');

    const dashEmail = document.getElementById('dash-student-email');
    if (dashEmail) {
      if (student.email && !student.email.endsWith('@sms.local')) {
        dashEmail.textContent = student.email;
        dashEmail.style.display = 'inline-block';
      } else if (student.isGuest) {
        dashEmail.textContent = 'Guest Mode (Local Storage)';
        dashEmail.style.display = 'inline-block';
      } else {
        dashEmail.textContent = `👤 Account: ${student.fullName || 'Active'}`;
        dashEmail.style.display = 'inline-block';
      }
    }

    const dashDesc = document.getElementById('dash-student-desc');
    if (dashDesc) {
      dashDesc.textContent = student.description || (student.isGuest ? 'No bio yet. Click "Customize Profile & Habits" to personalize your profile and behavioral hax.' : 'Ambitious student building unstoppable daily self-management habits.');
    }

    // Dashboard Abilities Pills & Cards
    const typeClassMap = {
      'Discipline': 'badge-discipline',
      'Focus': 'badge-focus',
      'Grit': 'badge-grit',
      'Self-Learning': 'badge-self-learning',
      'Custom': 'badge-custom'
    };

    const abilitiesContainer = document.getElementById('dash-abilities-container');
    if (abilitiesContainer) {
      abilitiesContainer.innerHTML = '';
      const abilities = student.abilitiesHax || [];
      const activeList = abilities.filter(a => a.active);
      if (activeList.length === 0) {
        abilitiesContainer.innerHTML = '<span style="font-size: 12px; color: #94a3b8; font-style: italic;">✨ No abilities added yet. Click "Customize Profile & Habits" to type what you can do!</span>';
      } else {
        activeList.forEach(a => {
          const chip = document.createElement('div');
          chip.className = 'hax-card-chip';
          const badgeClass = typeClassMap[a.type] || 'badge-custom';
          chip.innerHTML = `
            <div class="hax-card-chip-header">
              <span>${a.icon || '⚡'} ${a.name}</span>
              <span class="ability-type-badge ${badgeClass}" style="font-size: 9px; padding: 1px 6px;">${a.type || 'Ability'}</span>
            </div>
            <div class="hax-card-chip-desc">${a.description || 'Custom behavioral superpower strategy'}</div>
          `;
          abilitiesContainer.appendChild(chip);
        });
      }
    }

    // Dashboard Habit Routine Banner
    const cueEl = document.getElementById('dash-habit-cue');
    if (cueEl) cueEl.textContent = habit.habitCue || 'Set your habit cue (e.g., After arriving home...)';

    const routineEl = document.getElementById('dash-habit-routine');
    if (routineEl) routineEl.textContent = habit.microRoutine2min || 'Set your 2-minute micro routine (e.g., Sit at desk and learn 5 words)';

    const rewardEl = document.getElementById('dash-habit-reward');
    if (rewardEl) rewardEl.textContent = habit.immediateReward || 'Set your immediate reward (e.g., Stick a sticker & play a song)';
  }

  initProfileAndAuth() {
    this.initModalTabs();

    // Profile Modal Open & Close
    const btnOpenProfile = document.getElementById('btn-open-profile');
    if (btnOpenProfile) {
      btnOpenProfile.addEventListener('click', () => this.openProfileModal());
    }

    const btnDashEdit = document.getElementById('btn-dash-edit-profile');
    if (btnDashEdit) {
      btnDashEdit.addEventListener('click', () => this.openProfileModal());
    }

    const btnCloseProfile = document.getElementById('btn-close-profile-modal');
    if (btnCloseProfile) {
      btnCloseProfile.addEventListener('click', () => this.closeProfileModal());
    }

    const btnCancelProfile = document.getElementById('btn-cancel-profile');
    if (btnCancelProfile) {
      btnCancelProfile.addEventListener('click', () => this.closeProfileModal());
    }

    // Save Profile
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => this.saveProfileAndHabit());
    }

    // Custom Avatar Input
    const inputCustomAvatar = document.getElementById('input-custom-avatar');
    if (inputCustomAvatar) {
      inputCustomAvatar.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        this.selectedAvatar = val || (this.state.student && this.state.student.avatarUrl) || '🧑‍🎓';
        this.renderAvatarPreview();
        const container = document.getElementById('avatar-presets-container');
        if (container) {
          container.querySelectorAll('.avatar-preset-item').forEach(el => el.classList.remove('selected'));
        }
      });
    }

    // Preset Ability Title Selector
    const selectPresetHax = document.getElementById('select-preset-hax-title');
    if (selectPresetHax) {
      selectPresetHax.addEventListener('change', (e) => {
        const val = e.target.value;
        const presets = window.SMS_MODELS.ABILITY_PRESET_TITLES || [];
        const found = presets.find(p => p.title === val);
        if (found) {
          const nameInput = document.getElementById('input-new-hax-name');
          const iconInput = document.getElementById('input-new-hax-icon');
          const typeSelect = document.getElementById('select-new-hax-type');
          const descInput = document.getElementById('input-new-hax-desc');
          if (nameInput) nameInput.value = found.title;
          if (iconInput) iconInput.value = found.icon;
          if (typeSelect) typeSelect.value = found.type;
          if (descInput) descInput.value = found.whatICanDo;
        }
      });
    }

    // Add Custom Ability
    const btnAddHax = document.getElementById('btn-add-new-hax');
    if (btnAddHax) {
      btnAddHax.addEventListener('click', () => this.addCustomHax());
    }

    // Auth Modal Open & Close
    const btnOpenAuth = document.getElementById('btn-open-auth');
    if (btnOpenAuth) {
      btnOpenAuth.addEventListener('click', () => this.openAuthModal());
    }

    const btnCloseAuth = document.getElementById('btn-close-auth-modal');
    if (btnCloseAuth) {
      btnCloseAuth.addEventListener('click', () => this.closeAuthModal());
    }

    const btnContinueGuest = document.getElementById('btn-continue-guest');
    if (btnContinueGuest) {
      btnContinueGuest.addEventListener('click', () => {
        this.closeAuthModal();
        this.showToast('👤 Continuing in Guest Mode. All features unlocked!');
      });
    }

    // Login & Register Form Actions
    const btnLogin = document.getElementById('btn-do-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', () => this.handleLogin());
    }

    const btnRegister = document.getElementById('btn-do-register');
    if (btnRegister) {
      btnRegister.addEventListener('click', () => this.handleRegister());
    }

    const btnQuickAlan = document.getElementById('btn-quick-switch-alan');
    if (btnQuickAlan) {
      btnQuickAlan.addEventListener('click', () => {
        const emailInput = document.getElementById('input-login-email');
        const passInput = document.getElementById('input-login-password');
        if (emailInput) emailInput.value = 'khoian.alan@vinschool.edu.vn';
        if (passInput) passInput.value = '123456';
        this.handleLogin();
      });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.handleLogout());
    }

    const btnModalLogout = document.getElementById('btn-modal-logout');
    if (btnModalLogout) {
      btnModalLogout.addEventListener('click', () => this.handleLogout());
    }

    // Global ESC key listener to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeProfileModal();
        this.closeAuthModal();
      }
    });
  }

  initModalTabs() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      const tabBtns = modal.querySelectorAll('.modal-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.target;
          tabBtns.forEach(b => b.classList.remove('active'));
          modal.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));

          btn.classList.add('active');
          const targetPane = document.getElementById(targetId);
          if (targetPane) targetPane.classList.add('active');
        });
      });

      // Close modal on clicking outside content
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  }

  openProfileModal() {
    const student = this.state.student || {};
    const habit = this.state.habit || {};
    this.selectedAvatar = student.avatarUrl || (student.isGuest ? '👤' : '🧑‍🎓');

    // Form fields
    const nameInput = document.getElementById('input-profile-name');
    if (nameInput) nameInput.value = student.fullName || (student.isGuest ? 'Guest User' : '');

    const emailInput = document.getElementById('input-profile-email');
    if (emailInput) {
      if (student.email && !student.email.endsWith('@sms.local')) {
        emailInput.value = student.email;
      } else if (student.isGuest) {
        emailInput.value = 'Guest User (Local Storage)';
      } else {
        emailInput.value = '(No email attached - Local Account)';
      }
    }

    const descInput = document.getElementById('textarea-profile-desc');
    if (descInput) descInput.value = student.description || '';

    const customAvatarInput = document.getElementById('input-custom-avatar');
    if (customAvatarInput) {
      customAvatarInput.value = (student.avatarUrl && (student.avatarUrl.startsWith('http') || student.avatarUrl.length > 4)) ? student.avatarUrl : '';
    }

    // Habit fields
    const cueInput = document.getElementById('input-profile-cue');
    if (cueInput) cueInput.value = habit.habitCue || '';

    const routineInput = document.getElementById('input-profile-routine');
    if (routineInput) routineInput.value = habit.microRoutine2min || '';

    const rewardInput = document.getElementById('input-profile-reward');
    if (rewardInput) rewardInput.value = habit.immediateReward || '';

    this.renderAvatarPreview();
    this.renderAvatarPresets('avatar-presets-container');
    this.renderAbilityTitlePresets();
    this.renderAbilitiesList();

    const modal = document.getElementById('modal-profile');
    if (modal) modal.classList.add('open');
  }

  closeProfileModal() {
    const modal = document.getElementById('modal-profile');
    if (modal) modal.classList.remove('open');
  }

  renderAvatarPreview() {
    const preview = document.getElementById('profile-preview-avatar');
    if (preview) {
      preview.innerHTML = this.renderAvatarContent(this.selectedAvatar);
    }
  }

  renderAvatarPresets(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const presets = window.SMS_MODELS.PRESET_AVATARS || ['🧑‍🎓', '👨‍💻', '👩‍🔬', '🥷', '🦁', '🚀', '⚡', '🧙‍♂️'];

    presets.forEach(p => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'avatar-preset-item' + (this.selectedAvatar === p ? ' selected' : '');
      item.textContent = p;
      item.addEventListener('click', () => {
        this.selectedAvatar = p;
        const customInput = document.getElementById('input-custom-avatar');
        if (customInput) customInput.value = '';
        this.renderAvatarPreview();
        container.querySelectorAll('.avatar-preset-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
      container.appendChild(item);
    });
  }

  renderAbilityTitlePresets() {
    const presets = window.SMS_MODELS.ABILITY_PRESET_TITLES || [];
    const select = document.getElementById('select-preset-hax-title');
    if (select) {
      select.innerHTML = '<option value="">-- Select from popular ability titles --</option>';
      presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.title;
        opt.textContent = `${p.icon} ${p.title} (${p.type})`;
        select.appendChild(opt);
      });
    }

    const chipsContainer = document.getElementById('quick-title-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      presets.forEach(p => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-title-chip';
        chip.textContent = `${p.icon} ${p.title}`;
        chip.addEventListener('click', () => {
          const nameInput = document.getElementById('input-new-hax-name');
          const iconInput = document.getElementById('input-new-hax-icon');
          const typeSelect = document.getElementById('select-new-hax-type');
          const descInput = document.getElementById('input-new-hax-desc');

          if (nameInput) nameInput.value = p.title;
          if (iconInput) iconInput.value = p.icon;
          if (typeSelect) typeSelect.value = p.type;
          if (descInput) descInput.value = p.whatICanDo;
          if (select) select.value = p.title;

          chipsContainer.querySelectorAll('.quick-title-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        });
        chipsContainer.appendChild(chip);
      });
    }
  }

  renderAbilitiesList() {
    const container = document.getElementById('abilities-list-container');
    if (!container) return;
    container.innerHTML = '';

    const abilities = this.state.student.abilitiesHax || [];
    const countBadge = document.getElementById('abilities-count-badge');
    const activeCount = abilities.filter(a => a.active).length;
    if (countBadge) {
      countBadge.textContent = `${abilities.length} abilities (${activeCount} active)`;
    }

    if (abilities.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; color: #64748b;">
          <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
          <p style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">No abilities added yet</p>
          <p style="font-size: 12px; margin: 0;">Choose a preset title above or enter a custom one, then type what you can do and click <strong>"Add to My Abilities"</strong>.</p>
        </div>
      `;
      return;
    }

    const typeClassMap = {
      'Discipline': 'badge-discipline',
      'Focus': 'badge-focus',
      'Grit': 'badge-grit',
      'Self-Learning': 'badge-self-learning',
      'Custom': 'badge-custom'
    };

    abilities.forEach((ability, idx) => {
      const card = document.createElement('div');
      card.className = 'ability-card' + (ability.active ? ' active' : '');
      const badgeClass = typeClassMap[ability.type] || 'badge-custom';

      card.innerHTML = `
        <div class="ability-card-left" style="flex: 1;">
          <div class="ability-card-icon">${ability.icon || '⚡'}</div>
          <div class="ability-card-body" style="flex: 1;">
            <div class="ability-card-title" style="margin-bottom: 4px;">
              <span style="font-weight: 700;">${ability.name}</span>
              <span class="ability-type-badge ${badgeClass}">${ability.type}</span>
            </div>
            <div style="margin-top: 4px;">
              <label style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">What I can do (Edit directly):</label>
              <textarea class="ability-card-edit-desc" rows="2" data-idx="${idx}" placeholder="Type what you can do with this ability...">${ability.description || ''}</textarea>
            </div>
          </div>
        </div>
        <div class="ability-card-right" style="margin-left: 12px; align-items: flex-start; padding-top: 4px;">
          <label class="toggle-switch" title="Toggle active in dashboard">
            <input type="checkbox" class="ability-checkbox" data-idx="${idx}" ${ability.active ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
          <button type="button" class="btn-delete-row btn-delete-hax" data-idx="${idx}" title="Delete ability">✕</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Bind inline edit textareas
    container.querySelectorAll('.ability-card-edit-desc').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (this.state.student.abilitiesHax[idx]) {
          this.state.student.abilitiesHax[idx].description = e.target.value;
          window.smsStorage.saveState(this.state);
          this.renderStudentProfile();
        }
      });
    });

    // Bind checkboxes
    container.querySelectorAll('.ability-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.state.student.abilitiesHax[idx].active = e.target.checked;
        const card = e.target.closest('.ability-card');
        if (card) card.classList.toggle('active', e.target.checked);
        window.smsStorage.saveState(this.state);
        this.renderStudentProfile();
        if (countBadge) {
          const act = this.state.student.abilitiesHax.filter(a => a.active).length;
          countBadge.textContent = `${this.state.student.abilitiesHax.length} abilities (${act} active)`;
        }
      });
    });

    // Bind delete
    container.querySelectorAll('.btn-delete-hax').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const name = this.state.student.abilitiesHax[idx] ? this.state.student.abilitiesHax[idx].name : 'Ability';
        this.state.student.abilitiesHax.splice(idx, 1);
        window.smsStorage.saveState(this.state);
        this.renderAbilitiesList();
        this.renderStudentProfile();
        this.showToast(`🗑️ Removed "${name}".`);
      });
    });
  }

  addCustomHax() {
    const nameInput = document.getElementById('input-new-hax-name');
    const iconInput = document.getElementById('input-new-hax-icon');
    const typeSelect = document.getElementById('select-new-hax-type');
    const descInput = document.getElementById('input-new-hax-desc');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert('Please select a preset title or type a custom ability title.');
      return;
    }

    const icon = (iconInput && iconInput.value.trim()) || '⚡';
    const type = (typeSelect && typeSelect.value) || 'Custom';
    const desc = (descInput && descInput.value.trim()) || 'Custom behavioral strategy.';

    const newHax = {
      id: 'hax-' + Date.now(),
      name,
      icon,
      type,
      description: desc,
      active: true,
      isCustom: true
    };

    if (!this.state.student.abilitiesHax) {
      this.state.student.abilitiesHax = [];
    }

    this.state.student.abilitiesHax.push(newHax);
    window.smsStorage.saveState(this.state);

    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    const select = document.getElementById('select-preset-hax-title');
    if (select) select.value = '';
    const chipsContainer = document.getElementById('quick-title-chips');
    if (chipsContainer) {
      chipsContainer.querySelectorAll('.quick-title-chip').forEach(c => c.classList.remove('active'));
    }

    this.renderAbilitiesList();
    this.renderStudentProfile();
    this.showToast(`✨ Added "${name}" to your abilities!`);
  }

  async saveProfileAndHabit() {
    const nameInput = document.getElementById('input-profile-name');
    const descInput = document.getElementById('textarea-profile-desc');
    const customAvatarInput = document.getElementById('input-custom-avatar');

    if (nameInput && nameInput.value.trim()) {
      this.state.student.fullName = nameInput.value.trim();
    }

    if (customAvatarInput && customAvatarInput.value.trim()) {
      this.selectedAvatar = customAvatarInput.value.trim();
    }
    this.state.student.avatarUrl = this.selectedAvatar || '🧑‍🎓';

    if (descInput) {
      this.state.student.description = descInput.value.trim();
    }

    // Habit
    const cueInput = document.getElementById('input-profile-cue');
    const routineInput = document.getElementById('input-profile-routine');
    const rewardInput = document.getElementById('input-profile-reward');

    if (cueInput) this.state.habit.habitCue = cueInput.value.trim();
    if (routineInput) this.state.habit.microRoutine2min = routineInput.value.trim();
    if (rewardInput) this.state.habit.immediateReward = rewardInput.value.trim();

    window.smsStorage.saveState(this.state);

    // Sync to SQLite backend if not guest
    if (window.smsApiClient && !this.state.student.isGuest) {
      try {
        await window.smsApiClient.updateProfile({
          full_name: this.state.student.fullName,
          avatar_url: this.state.student.avatarUrl,
          description: this.state.student.description,
          abilities_hax: this.state.student.abilitiesHax
        });
        await window.smsApiClient.updateHabit({
          habit_cue: this.state.habit.habitCue,
          micro_routine_2min: this.state.habit.microRoutine2min,
          immediate_reward: this.state.habit.immediateReward
        });
      } catch (err) {
        console.warn('Backend sync warning:', err);
      }
    }

    this.renderStudentProfile();
    this.closeProfileModal();
    this.showToast('✅ Profile, habit & abilities saved successfully!');
  }

  /* ================== AUTHENTICATION (LOGIN / REGISTER) ================== */
  openAuthModal() {
    const loginMsg = document.getElementById('auth-login-msg');
    if (loginMsg) loginMsg.textContent = '';

    const regMsg = document.getElementById('auth-reg-msg');
    if (regMsg) regMsg.textContent = '';

    const currentUserBanner = document.getElementById('auth-current-user-banner');
    const currentUserName = document.getElementById('auth-current-user-name');
    if (currentUserBanner && currentUserName) {
      if (this.state.student && !this.state.student.isGuest) {
        currentUserBanner.style.display = 'flex';
        const emailStr = (this.state.student.email && !this.state.student.email.endsWith('@sms.local'))
          ? ` • ${this.state.student.email}`
          : '';
        currentUserName.textContent = `${this.state.student.fullName || 'Student'}${emailStr}`;
      } else {
        currentUserBanner.style.display = 'none';
      }
    }

    this.renderRegisterAvatarPresets();

    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('open');
  }

  closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('open');
  }

  handleLogout() {
    this.state = window.smsStorage.resetToGuest();
    if (window.smsApiClient) {
      window.smsApiClient.setUserId(null);
    }
    this.selectedAvatar = '👤';
    this.render();
    this.closeAuthModal();
    this.showToast('🚪 Logged out successfully. You are now in Guest Mode.');
  }

  renderRegisterAvatarPresets() {
    const container = document.getElementById('reg-avatar-presets');
    if (!container) return;
    container.innerHTML = '';
    const presets = window.SMS_MODELS.PRESET_AVATARS || ['🧑‍🎓', '👨‍💻', '👩‍🔬', '🥷', '🦁', '🚀', '⚡', '🧙‍♂️'];
    const regAvatarInput = document.getElementById('input-reg-avatar');

    presets.forEach(p => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'avatar-preset-item' + (regAvatarInput && regAvatarInput.value === p ? ' selected' : '');
      item.textContent = p;
      item.addEventListener('click', () => {
        if (regAvatarInput) regAvatarInput.value = p;
        container.querySelectorAll('.avatar-preset-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
      container.appendChild(item);
    });
  }

  async handleLogin() {
    const emailInput = document.getElementById('input-login-email');
    const passInput = document.getElementById('input-login-password');
    const msgEl = document.getElementById('auth-login-msg');

    const identifier = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!identifier) {
      if (msgEl) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '❌ Please enter your username or email address.';
      }
      return;
    }

    if (msgEl) {
      msgEl.style.color = '#0284c7';
      msgEl.textContent = '⏳ Logging in...';
    }

    let serverUser = null;

    if (window.smsApiClient) {
      try {
        const res = await window.smsApiClient.login({ identifier, password });
        if (res && res.data) {
          serverUser = res.data;
        }
      } catch (err) {
        const isNetworkErr = !err.message || 
          err.message.includes('fetch') || 
          err.message.includes('Network') || 
          err.message.includes('Failed to fetch') ||
          err.message.includes('connect');

        if (!isNetworkErr) {
          if (msgEl) {
            msgEl.style.color = '#dc2626';
            msgEl.textContent = `❌ ${err.message || 'Login failed'}`;
          }
          return;
        }
        console.warn('Backend server offline during login, using local account fallback:', err);
      }
    }

    if (serverUser) {
      this.state.student.id = serverUser.id;
      this.state.student.email = serverUser.email || '';
      this.state.student.fullName = serverUser.fullName || serverUser.full_name || identifier;
      this.state.student.avatarUrl = serverUser.avatarUrl || serverUser.avatar_url || '🧑‍🎓';
      this.selectedAvatar = this.state.student.avatarUrl;
      this.state.student.description = serverUser.description || '';
      this.state.student.isGuest = false;
      this.state.student.abilitiesHax = serverUser.abilitiesHax || 
        JSON.parse(serverUser.abilities_hax_json || '[]') || 
        JSON.parse(JSON.stringify(window.SMS_MODELS.DEFAULT_ABILITIES_HAX));
      this.state.student.currentStreakDays = serverUser.streakDays || 0;
      this.state.student.streakStatus = serverUser.streakStatus || 'ACTIVE';

      if (window.smsApiClient) {
        window.smsApiClient.setUserId(serverUser.id);
      }
      window.smsStorage.saveState(this.state);
      await this.syncWithBackend();
      this.render();
      this.closeAuthModal();
      this.showToast(`👋 Welcome back, ${this.state.student.fullName}!`);
    } else {
      // Local account login
      this.state.student.id = 'student-local-' + Date.now();
      this.state.student.email = identifier.includes('@') ? identifier : '';
      this.state.student.fullName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      this.state.student.isGuest = false;
      if (window.smsApiClient) {
        window.smsApiClient.setUserId(this.state.student.id);
      }
      window.smsStorage.saveState(this.state);
      this.render();
      this.closeAuthModal();
      this.showToast(`👋 Signed in as ${this.state.student.fullName} (Local Account)`);
    }
  }

  async handleRegister() {
    const nameInput = document.getElementById('input-reg-name');
    const emailInput = document.getElementById('input-reg-email');
    const passInput = document.getElementById('input-reg-password');
    const avatarInput = document.getElementById('input-reg-avatar');
    const descInput = document.getElementById('input-reg-desc');
    const msgEl = document.getElementById('auth-reg-msg');

    const fullName = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';
    const avatarUrl = (avatarInput && avatarInput.value.trim()) || '🧑‍🎓';
    const description = descInput ? descInput.value.trim() : '';

    // GMAIL / EMAIL IS NOW OPTIONAL! Only Full Name / Username is required.
    if (!fullName) {
      if (msgEl) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '❌ Full name or username is required.';
      }
      return;
    }

    if (!password) {
      if (msgEl) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '❌ Password is required.';
      }
      return;
    }

    if (msgEl) {
      msgEl.style.color = '#0284c7';
      msgEl.textContent = '⏳ Creating account...';
    }

    let serverUser = null;

    if (window.smsApiClient) {
      try {
        const res = await window.smsApiClient.register({
          fullName,
          email,
          password,
          avatarUrl,
          description,
          abilities: (this.state.student && this.state.student.abilitiesHax && this.state.student.abilitiesHax.length > 0)
            ? this.state.student.abilitiesHax
            : JSON.parse(JSON.stringify(window.SMS_MODELS.DEFAULT_ABILITIES_HAX))
        });
        if (res && res.data) {
          serverUser = res.data;
        }
      } catch (err) {
        const isNetworkErr = !err.message || 
          err.message.includes('fetch') || 
          err.message.includes('Network') || 
          err.message.includes('Failed to fetch') ||
          err.message.includes('connect');

        if (!isNetworkErr) {
          // Specific backend validation message (e.g. Email already registered)
          if (msgEl) {
            msgEl.style.color = '#dc2626';
            msgEl.textContent = `❌ ${err.message || 'Registration failed'}`;
          }
          return;
        }
        console.warn('Backend server offline during registration, falling back to local account:', err);
      }
    }

    if (serverUser) {
      this.state.student.id = serverUser.id;
      this.state.student.email = serverUser.email || email;
      this.state.student.fullName = serverUser.fullName || serverUser.full_name || fullName;
      this.state.student.avatarUrl = serverUser.avatarUrl || serverUser.avatar_url || avatarUrl;
      this.selectedAvatar = this.state.student.avatarUrl;
      this.state.student.description = serverUser.description || description;
      this.state.student.isGuest = false;
      this.state.student.abilitiesHax = serverUser.abilitiesHax || 
        JSON.parse(serverUser.abilities_hax_json || '[]') || 
        JSON.parse(JSON.stringify(window.SMS_MODELS.DEFAULT_ABILITIES_HAX));
      this.state.student.currentStreakDays = 0;
      this.state.student.streakStatus = 'ACTIVE';

      if (window.smsApiClient) {
        window.smsApiClient.setUserId(serverUser.id);
      }
      window.smsStorage.saveState(this.state);
      await this.syncWithBackend();
      this.render();
      this.closeAuthModal();
      this.showToast(`🎉 Account created! Welcome, ${this.state.student.fullName}.`);
    } else {
      // Local account creation fallback
      this.state.student.id = 'student-' + Date.now();
      this.state.student.fullName = fullName;
      this.state.student.email = email;
      this.state.student.avatarUrl = avatarUrl;
      this.selectedAvatar = avatarUrl;
      this.state.student.description = description;
      this.state.student.isGuest = false;
      if (window.smsApiClient) {
        window.smsApiClient.setUserId(this.state.student.id);
      }
      window.smsStorage.saveState(this.state);
      this.render();
      this.closeAuthModal();
      this.showToast(`🎉 Account created! Welcome, ${fullName}.`);
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
