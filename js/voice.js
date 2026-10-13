// Voice Engine & Animated Orb Controller for VOX
// Supports Web Speech API with seamless text fallback and multi-state animations

import { utils } from './utils.js';

export class VoiceController {
  constructor(options = {}) {
    this.state = 'idle'; // idle | listening | processing | understanding | confirmation | saved | error
    this.recognition = null;
    this.isSupported = false;
    this.speechEnabled = true;
    this.onStateChange = options.onStateChange || (() => {});
    this.onTranscriptResult = options.onTranscriptResult || (() => {});
    this.onError = options.onError || (() => {});

    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-IN'; // Indian English recognition for rupee and local terms

        this.recognition.onstart = () => {
          this.setState('listening');
          utils.playChime('listen');
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            this.setState('processing');
            this.onTranscriptResult(finalTranscript.trim(), true);
          } else if (interimTranscript) {
            this.onTranscriptResult(interimTranscript.trim(), false);
          }
        };

        this.recognition.onerror = (event) => {
          console.warn('Speech recognition error event:', event.error);
          let message = 'Could not catch that clearly.';
          if (event.error === 'not-allowed') {
            message = 'Microphone permission denied. You can type in the prompt box.';
          } else if (event.error === 'no-speech') {
            message = 'No speech detected. Tap orb and speak.';
          } else if (event.error === 'network') {
            message = 'Speech network issue. Try typing or check connection.';
          }
          this.setState('idle');
          this.onError(message, event.error);
        };

        this.recognition.onend = () => {
          if (this.state === 'listening') {
            this.setState('idle');
          }
        };
      } catch (e) {
        console.warn('Could not initialize speech recognition:', e);
        this.isSupported = false;
      }
    } else {
      this.isSupported = false;
    }
  }

  setState(newState, detail = null) {
    this.state = newState;
    this.onStateChange(newState, detail);
  }

  startListening() {
    if (!this.isSupported || !this.recognition) {
      this.setState('listening');
      this.onError('Speech Recognition not supported in this browser. Please use the Voice Command input field below to type your command.', 'unsupported');
      return;
    }

    try {
      if (this.state === 'listening') {
        this.recognition.stop();
        this.setState('idle');
        return;
      }
      this.recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      // If already started or aborting
      try {
        this.recognition.stop();
      } catch (e) {}
      this.setState('idle');
    }
  }

  stopListening() {
    if (this.recognition && this.state === 'listening') {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.setState('idle');
  }

  // Allow manual entry (for keyboard or fallback input)
  processManualInput(text) {
    if (!text || !text.trim()) return;
    this.setState('processing');
    utils.playChime('listen');
    setTimeout(() => {
      this.onTranscriptResult(text.trim(), true);
    }, 250);
  }

  triggerSavedState(callback) {
    this.setState('saved');
    utils.playChime('success');
    setTimeout(() => {
      this.setState('idle');
      if (callback) callback();
    }, 1600);
  }

  setLanguage(lang) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  speakResponse(text) {
    if (this.speechEnabled && text) {
      utils.speak(text, this.lang || 'en-IN');
    }
  }
}

export default VoiceController;
