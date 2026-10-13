// Utility helpers for VOX MVP
export const utils = {
  // Format numbers to Indian Rupee standard format (e.g. ₹1,23,450)
  formatINR(amount, includeSymbol = true) {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return includeSymbol ? '₹0' : '0';
    }
    const num = Math.round(Number(amount));
    const isNegative = num < 0;
    const absVal = Math.abs(num).toString();
    
    let lastThree = absVal.substring(absVal.length - 3);
    const otherNumbers = absVal.substring(0, absVal.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    const sign = isNegative ? '-' : '';
    return includeSymbol ? `${sign}₹${res}` : `${sign}${res}`;
  },

  // Format date to readable string
  formatDate(dateInput) {
    if (!dateInput) return 'Today';
    let d;
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      d = dateInput.toDate();
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      d = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      return 'Today';
    }

    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  },

  formatTime(dateInput) {
    if (!dateInput) return '';
    let d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  // Calculate days remaining until target date
  daysUntil(targetDateInput) {
    if (!targetDateInput) return 0;
    const target = new Date(targetDateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  generateId() {
    return 'vox_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  },

  // Subtle Web Audio API Chimes (no external assets needed)
  playChime(type = 'listen') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'listen') {
        // High soft ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'success') {
        // Double pleasant chord
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + 0.4);
        });
      } else if (type === 'question') {
        // Soft question inflection
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio autoplay restriction or disabled
    }
  },

  // Web Speech Synthesis (spoken voice reply supporting en-IN and ta-IN)
  speak(text, lang = 'en-IN') {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Auto-detect Tamil characters if present
      const isTamil = lang === 'ta-IN' || /[\u0B80-\u0BFF]/.test(text);
      utterance.lang = isTamil ? 'ta-IN' : 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      let preferred = null;

      if (isTamil) {
        preferred = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil')) ||
                    voices.find(v => v.lang.includes('en-IN')) ||
                    voices[0];
      } else {
        preferred = voices.find(v => v.lang.includes('en-IN')) || 
                    voices.find(v => v.lang.includes('en-GB')) || 
                    voices.find(v => v.lang.includes('en'));
      }

      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  },

  // Simple Debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

export default utils;
