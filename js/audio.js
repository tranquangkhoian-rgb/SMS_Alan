/**
 * SMS - ALAN Audio Service
 * Uses browser Web Audio API to synthesize a calming, dual-tone chime
 * No external MP3 / audio asset downloads required.
 */

class AudioService {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCompletionChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Note 2: B5 (987.77 Hz) - slight delay for chime effect
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.6);

      // Note 3: E6 (1318.51 Hz) - harmonic sparkle
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.51, now + 0.3);
      gain3.gain.setValueAtTime(0.2, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 2.0);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }
}

window.smsAudio = new AudioService();
