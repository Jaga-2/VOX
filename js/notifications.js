// VOX Notification & Scheduled Daily Log Engine
// Handles Web Notifications API with in-app evening review triggers and documented browser limitations

import { utils } from './utils.js';

export const notificationService = {
  isSupported: 'Notification' in window,
  permission: 'Notification' in window ? Notification.permission : 'denied',

  async requestPermission() {
    if (!this.isSupported) return false;
    try {
      const res = await Notification.requestPermission();
      this.permission = res;
      return res === 'granted';
    } catch (e) {
      console.warn('Notification permission request error:', e);
      return false;
    }
  },

  // Trigger Daily Log notification or simulation (Bilingual)
  sendDailyLogReminder(onOpenCallback, lang = 'en-IN') {
    const isTamil = lang === 'ta-IN';
    const title = isTamil ? "🌙 VOX தினசரி பதிவு (இரவு 8:00)" : "🌙 VOX Daily Review (8:00 PM)";
    const body = isTamil ?
      "இன்றைய செலவுகளைச் சரிபார்த்து விடுபட்டதை பதிவு செய்வோம்." :
      "Let's review today's spending and make sure everything is logged.";

    if (this.isSupported && this.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/assets/icons/vox-icon.svg',
          tag: 'vox-daily-review'
        });
        notif.onclick = () => {
          window.focus();
          if (onOpenCallback) onOpenCallback();
        };
      } catch (err) {
        console.warn('Could not launch system notification, triggering in-app alert:', err);
      }
    }

    // Always play gentle reminder chime
    utils.playChime('question');
  },

  // In-app scheduled evening review check (e.g. after 8:00 PM)
  checkInAppEveningReview(dailyLogs = [], onTriggerCallback) {
    const now = new Date();
    const hour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    // Trigger if evening (>= 20:00) and today's log hasn't been completed yet
    const alreadyCompleted = (dailyLogs || []).some(log => log.date === todayStr);
    if (hour >= 20 && !alreadyCompleted) {
      if (onTriggerCallback) {
        onTriggerCallback();
      }
    }
  }
};

export default notificationService;
