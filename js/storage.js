/**
 * SMS - Self Management System
 * Local Storage Service
 * Manages offline-first persistence, Day 1 default state, and resets.
 */

const STORAGE_KEY = 'sms_self_management_system_state_v3';

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
    // Default to clean blank Guest state on first start
    return JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_GUEST_STATE));
  }

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  }

  resetToGuest() {
    const guest = JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_GUEST_STATE));
    this.saveState(guest);
    return guest;
  }

  resetToDay1() {
    return this.resetToGuest();
  }

  loadAlanDemo() {
    const alan = JSON.parse(JSON.stringify(window.SMS_MODELS.ALAN_DEMO_STATE));
    this.saveState(alan);
    return alan;
  }

  resetToFresh() {
    const fresh = JSON.parse(JSON.stringify(window.SMS_MODELS.INITIAL_GUEST_STATE));
    fresh.isOnboarded = false;
    fresh.activeTab = 'goals';
    this.saveState(fresh);
    return fresh;
  }
}

window.smsStorage = new StorageService();
