// Internationalization (i18n) Manager for VOX
// Supports English (en-IN) and Tamil (ta-IN)
import { enIN } from '../locales/en-IN.js';
import { taIN } from '../locales/ta-IN.js';

const STORAGE_LANG_KEY = 'vox_user_language';

export const i18n = {
  currentLang: 'en-IN',
  translations: {
    'en-IN': enIN,
    'ta-IN': taIN
  },
  listeners: [],

  init() {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && this.translations[saved]) {
      this.currentLang = saved;
    } else {
      this.currentLang = 'en-IN';
    }
    return this.currentLang;
  },

  setLanguage(lang) {
    if (!this.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    this.updateDOM();
    this.listeners.forEach(cb => cb(lang));
  },

  onLanguageChange(cb) {
    this.listeners.push(cb);
  },

  t(key, fallback = '') {
    const dict = this.translations[this.currentLang] || this.translations['en-IN'];
    return dict[key] || fallback || key;
  },

  getVoiceLang() {
    return this.currentLang === 'ta-IN' ? 'ta-IN' : 'en-IN';
  },

  // Update elements that have data-i18n attribute
  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
        el.placeholder = translation;
      } else {
        el.innerText = translation;
      }
    });

    // Update document title and lang attribute
    document.documentElement.lang = this.currentLang.split('-')[0];
  }
};

export default i18n;
