/**
 * SMS - ALAN Drift-Free Timer Worker
 * Runs countdown intervals independently of main thread throttling.
 */

let timerInterval = null;
let endTime = null;
let remainingSeconds = 0;
let isPaused = false;

self.onmessage = function (e) {
  const data = e.data;

  switch (data.action) {
    case 'START':
      if (timerInterval) clearInterval(timerInterval);
      remainingSeconds = data.duration;
      endTime = Date.now() + remainingSeconds * 1000;
      isPaused = false;

      timerInterval = setInterval(() => {
        if (isPaused) return;

        const now = Date.now();
        const diff = Math.round((endTime - now) / 1000);

        if (diff <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          self.postMessage({ action: 'TICK', remainingSeconds: 0 });
          self.postMessage({ action: 'COMPLETE' });
        } else {
          remainingSeconds = diff;
          self.postMessage({ action: 'TICK', remainingSeconds: diff });
        }
      }, 1000);
      break;

    case 'PAUSE':
      isPaused = true;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      self.postMessage({ action: 'PAUSED', remainingSeconds });
      break;

    case 'RESUME':
      if (remainingSeconds > 0) {
        endTime = Date.now() + remainingSeconds * 1000;
        isPaused = false;
        timerInterval = setInterval(() => {
          if (isPaused) return;
          const now = Date.now();
          const diff = Math.round((endTime - now) / 1000);
          if (diff <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            self.postMessage({ action: 'TICK', remainingSeconds: 0 });
            self.postMessage({ action: 'COMPLETE' });
          } else {
            remainingSeconds = diff;
            self.postMessage({ action: 'TICK', remainingSeconds: diff });
          }
        }, 1000);
      }
      break;

    case 'RESET':
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      remainingSeconds = data.duration || 1200;
      self.postMessage({ action: 'RESET', remainingSeconds });
      break;
  }
};
