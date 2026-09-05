/**
 * SMS - Self Management System
 * Local Storage Service
 * Manages offline-first persistence, Day 1 default state, and resets.
 */

const STORAGE_KEY = 'sms_self_management_system_state_v2';

class StorageService {
  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
    // Default to Day 1 starting state
    return JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_DAY1_STATE));
  }

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  }

  resetToDay1() {
    const day1 = JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_DAY1_STATE));
    this.saveState(day1);
    return day1;
  }

  resetToFresh() {
    const fresh = JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_EMPTY_STATE));
    this.saveState(fresh);
    return fresh;
  }
}

window.smsStorage = new StorageService();
