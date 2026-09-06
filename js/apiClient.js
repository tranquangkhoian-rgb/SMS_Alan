/**
 * SMS - Self Management System
 * API Client & Synchronization Engine
 * Communicates with the Express + SQLite3 backend when available.
 */

class ApiClient {
  constructor() {
    this.baseUrl = window.location.origin.includes('http')
      ? window.location.origin
      : 'http://localhost:3000';
    this.isOnline = false;
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        this.isOnline = (json.status === 'success');
        return this.isOnline;
      }
    } catch (e) {
      this.isOnline = false;
    }
    return false;
  }

  async getDashboardSummary() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/dashboard/summary`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local state:', e);
    }
    return null;
  }

  async getDailyLoopToday() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/daily-loop/today`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local state:', e);
    }
    return null;
  }

  async submitPlan(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/daily-loop/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for plan submit');
    }
    return null;
  }

  async finishFocus(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/focus/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for focus finish');
    }
    return null;
  }

  async submitEndDay(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/daily-loop/end-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for end day submit');
    }
    return null;
  }

  async activateSafetyNet(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/daily-loop/safety-net/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for safety net activate');
    }
    return null;
  }

  async finalizeWeekly(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/weekly-review/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for weekly finalize');
    }
    return null;
  }

  async skipDay(count = 1) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/beta/skip-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for skip day');
    }
    return null;
  }

  async jumpDay(targetDay) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/beta/jump-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDay })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for jump day');
    }
    return null;
  }

  async resetDay1() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/beta/reset-day1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Offline mode for reset day 1');
    }
    return null;
  }

  async register(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      return data;
    } catch (e) {
      console.warn('Register error:', e);
      throw e;
    }
  }

  async login(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data;
    } catch (e) {
      console.warn('Login error:', e);
      throw e;
    }
  }

  async getMe() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/me`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Get current user profile error:', e);
    }
    return null;
  }

  async updateProfile(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update profile failed');
      return data;
    } catch (e) {
      console.warn('Update profile error:', e);
      throw e;
    }
  }

  async updateHabit(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/user/habit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update habit failed');
      return data;
    } catch (e) {
      console.warn('Update habit error:', e);
      throw e;
    }
  }
}

window.smsApiClient = new ApiClient();
