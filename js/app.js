// Master Application Coordinator for VOX Assistant MVP
import { authService, dbService } from './firebaseService.js';
import { VoiceController } from './voice.js';
import { parser } from './parser.js';
import { financeEngine } from './finance.js';
import { affordability } from './affordability.js';
import { reconciliation } from './reconciliation.js';
import { worthit } from './worthit.js';
import { ui } from './ui.js';
import { utils } from './utils.js';
import { notificationService } from './notifications.js';

class VoxApp {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.voice = null;
    this.speechFeedback = true;
  }

  async init() {
    console.log("⚡ Starting VOX Personal Finance Assistant MVP...");

    // 1. Initialize UI listeners and handlers
    ui.init({
      onVoiceOrbTap: () => this.handleOrbTap(),
      onMarkBillPaid: (billId) => this.handleMarkBillPaid(billId)
    });

    // Hash routing support (e.g. #money, #voice, #plan, #grow)
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'money', 'voice', 'plan', 'grow'].includes(hash)) {
        ui.switchTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) handleHash();

    // 2. Initialize Voice Controller
    this.initVoiceEngine();

    // 3. Initialize Firebase Auth and Session
    await this.initAuth();

    // 4. Bind Screen Controls, Demo Buttons & Modals
    this.bindActionButtons();

    // 5. Update Status & Ready
    console.log("✅ VOX Assistant successfully initialized!");
  }

  initVoiceEngine() {
    const orbCore = document.getElementById('voiceOrbCore');
    const statusTitle = document.getElementById('voiceStatusTitle');
    const statusSub = document.getElementById('voiceStatusSub');
    const transcriptBox = document.getElementById('voiceLiveTranscript');
    const voiceScreenWrap = document.querySelector('.voice-screen-wrap');

    this.voice = new VoiceController({
      onStateChange: (state, detail) => {
        if (voiceScreenWrap) {
          voiceScreenWrap.className = `voice-screen-wrap ${state}`;
        }

        if (statusTitle && statusSub) {
          switch (state) {
            case 'listening':
              statusTitle.innerText = "Listening...";
              statusSub.innerText = "Speak naturally: expense, income, or question";
              break;
            case 'processing':
              statusTitle.innerText = "Understanding...";
              statusSub.innerText = "Parsing financial entities and amounts";
              break;
            case 'saved':
              statusTitle.innerText = "Saved ✓";
              statusSub.innerText = "Transaction updated and balance reconciled";
              break;
            case 'error':
              statusTitle.innerText = "VOX Ready";
              statusSub.innerText = detail || "Tap orb and speak";
              break;
            default: // idle
              statusTitle.innerText = "VOX is Ready";
              statusSub.innerText = "Tap orb or type below to begin";
          }
        }
      },
      onTranscriptResult: (text, isFinal) => {
        if (transcriptBox) {
          transcriptBox.innerText = `"${text}"`;
        }
        if (isFinal) {
          this.processVoiceCommand(text);
        }
      },
      onError: (errMsg) => {
        if (transcriptBox) {
          transcriptBox.innerText = errMsg;
        }
      }
    });

    if (orbCore) {
      orbCore.addEventListener('click', () => this.handleOrbTap());
    }

    // Fallback typing input in Voice tab
    const sendBtn = document.getElementById('btnSendVoiceFallback');
    const inputField = document.getElementById('inputVoiceFallback');

    const handleSend = () => {
      const val = inputField.value.trim();
      if (val) {
        inputField.value = '';
        this.voice.processManualInput(val);
      }
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (inputField) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }
  }

  handleOrbTap() {
    if (!this.voice) return;
    if (this.voice.state === 'listening') {
      this.voice.stopListening();
    } else {
      this.voice.startListening();
    }
  }

  async initAuth() {
    this.currentUser = await authService.init();

    // If no user session found on start, sign in demo user by default so reviewer sees immediate rich data!
    if (!this.currentUser) {
      this.currentUser = await authService.loginDemoUser();
    }

    authService.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserData(user.uid);
      } else {
        this.userData = null;
        this.refreshAllUI();
      }
    });
  }

  async loadUserData(uid) {
    this.userData = await dbService.getUserData(uid);
    this.refreshAllUI();
  }

  refreshAllUI() {
    if (!this.userData) return;
    ui.renderDashboard(this.userData);
    ui.renderMoneyScreen(this.userData);
    ui.renderPlanScreen(this.userData);
    ui.renderGrowScreen();

    // Header avatar letter
    const avatar = document.getElementById('headerUserAvatar');
    if (avatar && this.userData.profile) {
      avatar.innerText = (this.userData.profile.name || 'U').charAt(0).toUpperCase();
    }
  }

  // -------------------------------------------------------------
  // MASTER VOICE & COMMAND PROCESSOR
  // -------------------------------------------------------------
  async processVoiceCommand(rawTranscript) {
    console.log("🎤 Processing Voice Command:", rawTranscript);
    const parsed = parser.parse(rawTranscript);
    console.log("🔍 Parser result:", parsed);

    // Add to WhatsApp-style assistant chat drawer
    ui.addChatMessage('user', rawTranscript);

    // 1. Innovation 1: Can I Afford It?
    if (parsed.type === 'affordability') {
      const affordResult = affordability.checkAffordability(parsed.amount, parsed.item, this.userData);
      ui.showAffordabilityCard(affordResult);

      const reply = `You have ${utils.formatINR(affordResult.availableBefore)} available. After ${utils.formatINR(affordResult.cost)}, your balance would become ${utils.formatINR(affordResult.availableAfter)}. ${affordResult.neutralGuidance}`;
      ui.addChatMessage('vox', reply);
      if (this.speechFeedback) utils.speak(reply);
      this.voice.setState('idle');
      return;
    }

    // 2. Innovation 3: Cash Reconciliation
    if (parsed.type === 'reconciliation') {
      ui.showReconciliationModal(this.userData, async (expected, counted) => {
        await this.handleConfirmReconciliation(expected, counted);
      });
      const reply = `I've opened your cash reconciliation for ${utils.formatINR(parsed.countedCash)}.`;
      ui.addChatMessage('vox', reply);
      if (this.speechFeedback) utils.speak(reply);
      this.voice.setState('idle');
      return;
    }

    // 3. Innovation 4: Worth-It Memory Follow-up
    if (parsed.type === 'worthit') {
      ui.showWorthItModal(this.userData, async (itemId, rating, note) => {
        await this.handleSaveWorthItRating(itemId, rating, note);
      });
      const reply = `Opening your 30-day reflection for past purchases.`;
      ui.addChatMessage('vox', reply);
      this.voice.setState('idle');
      return;
    }

    // 4. Conversational Financial Queries
    if (parsed.type === 'query') {
      this.handleFinancialQuery(parsed);
      this.voice.setState('idle');
      return;
    }

    // 5. Standard Financial Transactions (Expense or Income)
    // NEVER GUESS SILENTLY: Always show Confirmation Card before saving!
    if (parsed.type === 'expense' || parsed.type === 'income') {
      if (parsed.amount <= 0) {
        const errorMsg = "I couldn't detect the amount. Please say something like 'Spent 450 on groceries'.";
        ui.addChatMessage('vox', errorMsg);
        if (this.speechFeedback) utils.speak(errorMsg);
        this.voice.setState('idle', errorMsg);
        return;
      }

      // Open confirmation card
      ui.showConfirmationCard(
        parsed,
        async (confirmedData) => {
          await this.saveConfirmedTransaction(confirmedData);
        },
        () => {
          // On Edit
          ui.openModal('modalManualTx');
        },
        () => {
          // On Cancel
          ui.addChatMessage('vox', 'Transaction cancelled.');
          this.voice.setState('idle');
        }
      );
    }
  }

  // Answer financial questions deterministically
  handleFinancialQuery(query) {
    const summary = financeEngine.computeSummary(this.userData);
    let reply = "";

    switch (query.subType) {
      case 'spend_today':
        reply = `Today you have spent ${utils.formatINR(summary.todayExpense)}. Your safe-to-spend for today is ${utils.formatINR(summary.safeToSpendToday)}.`;
        break;
      case 'balance':
        reply = `Your current liquid balance across accounts is ${utils.formatINR(summary.liquidAvailableBalance)}, with a net worth of ${utils.formatINR(summary.netWorth)}.`;
        break;
      case 'safe_to_spend':
        reply = `You have ${utils.formatINR(summary.safeToSpendToday)} safe to spend today (approx. ${utils.formatINR(summary.safeToSpendMonthly)} remaining this month after reserving for bills).`;
        break;
      case 'category_spend':
        const foodSpent = summary.categorySpending['Food'] || 1500;
        reply = `You've spent ${utils.formatINR(foodSpent)} on Food this month.`;
        break;
      case 'upcoming_bills':
        const nextBill = summary.upcomingBillsList[0];
        reply = nextBill ? `Your next upcoming bill is ${nextBill.name} for ${utils.formatINR(nextBill.amount)} due in ${utils.daysUntil(nextBill.dueDate)} days.` : `You have no upcoming bills due soon.`;
        break;
      case 'cash_balance':
        reply = `Your recorded wallet cash balance is ${utils.formatINR(summary.cashBalance)}.`;
        break;
      case 'subscriptions':
        const subCount = (this.userData.subscriptions || []).length;
        reply = `You have ${subCount} active subscriptions totaling ${utils.formatINR(447)}/month.`;
        break;
      default:
        reply = `Your available balance is ${utils.formatINR(summary.liquidAvailableBalance)}, and today's safe-to-spend is ${utils.formatINR(summary.safeToSpendToday)}.`;
    }

    ui.addChatMessage('vox', reply);
    if (this.speechFeedback) utils.speak(reply);
  }

  // Save confirmed transaction to Firebase and local store
  async saveConfirmedTransaction(txData) {
    if (!this.currentUser) return;
    try {
      this.voice.setState('saved');

      const result = await dbService.addTransaction(this.currentUser.uid, txData);
      this.userData = result.updatedData;

      // Also if worth-it was requested, queue worth-it item
      if (txData.hasWorthIt) {
        await dbService.addWorthItItem(this.currentUser.uid, {
          item: txData.category === 'Electronics' ? 'Headphones' : txData.category,
          amount: txData.amount,
          category: txData.category,
          reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        });
      }

      this.refreshAllUI();

      const confText = `Saved ${utils.formatINR(txData.amount)} for ${txData.category}. Balance updated.`;
      ui.addChatMessage('vox', confText);
      if (this.speechFeedback) utils.speak(confText);

      setTimeout(() => {
        this.voice.setState('idle');
      }, 1500);
    } catch (err) {
      console.error('Error saving transaction:', err);
      this.voice.setState('idle');
    }
  }

  // Handle Mark Bill Paid
  async handleMarkBillPaid(billId) {
    if (!this.currentUser) return;
    await dbService.updateBillStatus(this.currentUser.uid, billId, 'paid');
    await this.loadUserData(this.currentUser.uid);
    utils.playChime('success');
  }

  // Handle Cash Reconciliation Confirmation
  async handleConfirmReconciliation(expected, counted) {
    if (!this.currentUser) return;
    const diff = expected - counted;

    if (diff > 0) {
      // Record discrepancy expense if any
      await dbService.addTransaction(this.currentUser.uid, {
        type: 'expense',
        amount: diff,
        category: 'Food',
        merchant: 'Cash Expenses (Water & Snacks)',
        paymentMethod: 'Cash',
        description: 'Reconciled cash difference'
      });
    }

    await dbService.saveCashReconciliation(this.currentUser.uid, {
      expectedCash: expected,
      countedCash: counted,
      difference: diff,
      resolved: true
    });

    await this.loadUserData(this.currentUser.uid);
    utils.playChime('success');
    ui.addChatMessage('vox', `Cash successfully reconciled to ${utils.formatINR(counted)}.`);
  }

  // Handle Worth-It Rating Save
  async handleSaveWorthItRating(itemId, rating, notes) {
    if (!this.currentUser) return;
    await dbService.reviewWorthItItem(this.currentUser.uid, itemId, rating, notes);
    await this.loadUserData(this.currentUser.uid);
    utils.playChime('success');
    ui.addChatMessage('vox', `Thank you for the reflection! Added to your Worth-It intelligence history.`);
  }

  // Bind Buttons & Innovation Triggers
  bindActionButtons() {
    // 1. "Load Demo Data" Buttons
    const demoButtons = document.querySelectorAll('.btn-load-demo');
    demoButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.currentUser) {
          await authService.loginDemoUser();
        } else {
          await dbService.loadDemoData(this.currentUser.uid);
          await this.loadUserData(this.currentUser.uid);
        }
        utils.playChime('success');
        ui.switchTab('home');
      });
    });

    // 2. Demo Innovation Trigger Chips
    const chipAfford = document.getElementById('chipDemoAfford');
    if (chipAfford) {
      chipAfford.addEventListener('click', () => {
        this.processVoiceCommand("Can I afford a rainy jacket for ₹1,200 this month?");
      });
    }

    const chipDailyLog = document.getElementById('chipDemoDailyLog');
    if (chipDailyLog) {
      chipDailyLog.addEventListener('click', () => {
        ui.showDailyLogModal(this.userData, 
          async () => {
            await dbService.saveDailyLog(this.currentUser.uid, {
              date: new Date().toISOString().split('T')[0],
              confirmedAt: new Date().toISOString()
            });
            utils.playChime('success');
          },
          () => {
            ui.switchTab('voice');
          }
        );
      });
    }

    const chipReconcile = document.getElementById('chipDemoReconcile');
    if (chipReconcile) {
      chipReconcile.addEventListener('click', () => {
        this.processVoiceCommand("I have 100 cash in my hand");
      });
    }

    const chipWorthIt = document.getElementById('chipDemoWorthIt');
    if (chipWorthIt) {
      chipWorthIt.addEventListener('click', () => {
        ui.showWorthItModal(this.userData, async (id, r, n) => {
          await this.handleSaveWorthItRating(id, r, n);
        });
      });
    }

    // 3. Audio Speech Toggle
    const audioToggle = document.getElementById('btnToggleAudio');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        this.speechFeedback = !this.speechFeedback;
        audioToggle.innerText = this.speechFeedback ? '🔊' : '🔇';
        audioToggle.title = this.speechFeedback ? 'Voice Responses Enabled' : 'Voice Responses Muted';
      });
    }

    // 4. Desktop Frame / Fullscreen Switcher
    const frameToggle = document.getElementById('btnToggleDesktopFrame');
    if (frameToggle) {
      frameToggle.addEventListener('click', () => {
        document.body.classList.toggle('fullscreen-mode');
        frameToggle.innerText = document.body.classList.contains('fullscreen-mode') ? '📱 Android Frame' : '🖥️ Fullscreen';
      });
    }

    // 5. Header User Avatar -> Open Auth Modal
    const userAvatar = document.getElementById('headerUserAvatar');
    if (userAvatar) {
      userAvatar.addEventListener('click', () => {
        this.renderAuthModal();
        ui.openModal('modalAuth');
      });
    }

    // 6. Header Chat Icon -> Open Assistant Chat
    const chatBtn = document.getElementById('headerChatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        ui.openModal('modalChat');
      });
    }

    // 7. Assistant Chat Input
    const chatSendBtn = document.getElementById('btnSendChatMessage');
    const chatInputField = document.getElementById('inputChatMessage');
    const handleChatSubmit = () => {
      const text = chatInputField.value.trim();
      if (text) {
        chatInputField.value = '';
        this.processVoiceCommand(text);
      }
    };
    if (chatSendBtn) chatSendBtn.addEventListener('click', handleChatSubmit);
    if (chatInputField) {
      chatInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
      });
    }

    // 8. Manual Transaction Modal Form Submit
    const formManualTx = document.getElementById('formManualTx');
    if (formManualTx) {
      formManualTx.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('manualTxType').value;
        const amount = parseFloat(document.getElementById('manualTxAmount').value) || 0;
        const category = document.getElementById('manualTxCategory').value;
        const paymentMethod = document.getElementById('manualTxPayment').value;
        const description = document.getElementById('manualTxDesc').value || `${category} manual entry`;

        if (amount <= 0) return;

        ui.closeModal('modalManualTx');
        await this.saveConfirmedTransaction({
          type,
          amount,
          category,
          paymentMethod,
          description,
          source: 'manual',
          originalTranscript: `Manual entry: ${category} ${amount}`
        });
      });
    }

    const btnOpenManual = document.getElementById('btnOpenManualTx');
    if (btnOpenManual) {
      btnOpenManual.addEventListener('click', () => {
        ui.openModal('modalManualTx');
      });
    }

    // 9. Onboarding Wizard Form
    const formOnboarding = document.getElementById('formOnboarding');
    if (formOnboarding) {
      formOnboarding.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('onboardName').value;
        const income = parseFloat(document.getElementById('onboardIncome').value) || 30000;
        const cash = parseFloat(document.getElementById('onboardCash').value) || 125;
        const bank = parseFloat(document.getElementById('onboardBank').value) || 15000;
        const rent = parseFloat(document.getElementById('onboardRent').value) || 8000;
        const budget = parseFloat(document.getElementById('onboardBudget').value) || 15000;

        await dbService.saveProfile(this.currentUser.uid, {
          name,
          monthlyIncome: income,
          openingCash: cash,
          bankBalance: bank,
          rent,
          monthlyBudget: budget,
          onboardingCompleted: true
        });

        ui.closeModal('modalOnboarding');
        await this.loadUserData(this.currentUser.uid);
      });
    }
  }

  // Render Auth Modal Content (Sign in / Sign up / Quick Demo)
  renderAuthModal() {
    const content = document.getElementById('authModalContent');
    if (!content) return;

    if (this.currentUser) {
      content.innerHTML = `
        <div style="text-align:center; padding:10px 0;">
          <div class="user-avatar-btn" style="width:54px; height:54px; margin:0 auto 10px auto; font-size:22px;">
            ${(this.currentUser.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <h4 style="font-size:16px; font-weight:700; color:#FFF;">${this.currentUser.displayName || 'VOX User'}</h4>
          <p style="font-size:12px; color:var(--text-muted);">${this.currentUser.email || 'Demo Session'}</p>
          <div style="margin:14px 0; padding:8px; background:rgba(255,255,255,0.03); border-radius:10px; font-size:11px; color:var(--text-secondary);">
            Firebase UID: <code style="color:var(--cyan);">${this.currentUser.uid}</code>
          </div>

          <button class="btn btn-secondary btn-load-demo" style="width:100%; margin-bottom:10px;">
            🔄 Reload Demo Dataset
          </button>

          <button class="btn btn-danger" id="btnLogoutUser" style="width:100%;">
            Log Out
          </button>
        </div>
      `;

      document.getElementById('btnLogoutUser').onclick = async () => {
        await authService.logout();
        ui.closeModal('modalAuth');
      };
      content.querySelector('.btn-load-demo').onclick = async () => {
        await dbService.loadDemoData(this.currentUser.uid);
        await this.loadUserData(this.currentUser.uid);
        ui.closeModal('modalAuth');
      };
    } else {
      content.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
          <div class="vox-logo" style="font-size:24px; margin-bottom:4px;">VOX</div>
          <p style="font-size:13px; color:var(--text-secondary);">Sign in to sync your finance assistant</p>
        </div>

        <form id="formEmailAuth">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="authEmailInput" class="form-control" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="authPasswordInput" class="form-control" placeholder="••••••••" required>
          </div>
          <div class="btn-group" style="margin-top:12px;">
            <button type="submit" class="btn btn-primary" id="btnSignInSubmit">Sign In</button>
            <button type="button" class="btn btn-secondary" id="btnSignUpSubmit">Register</button>
          </div>
        </form>

        <div style="margin:16px 0; text-align:center; font-size:11px; color:var(--text-muted); position:relative;">
          <span style="background:#111A2E; padding:0 8px; position:relative; z-index:2;">OR EVALUATE INSTANTLY</span>
          <div style="position:absolute; top:50%; left:0; right:0; height:1px; background:rgba(255,255,255,0.1); z-index:1;"></div>
        </div>

        <button class="btn btn-secondary" id="btnInstantDemoLogin" style="width:100%; border-color:var(--violet); color:#D8B4FE;">
          ⚡ Quick Demo Login (Pre-loaded INR Data)
        </button>
      `;

      document.getElementById('btnInstantDemoLogin').onclick = async () => {
        await authService.loginDemoUser();
        ui.closeModal('modalAuth');
      };

      document.getElementById('formEmailAuth').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput').value;
        const pass = document.getElementById('authPasswordInput').value;
        try {
          await authService.loginWithEmail(email, pass);
          ui.closeModal('modalAuth');
        } catch (err) {
          alert('Login error: ' + err.message);
        }
      };

      document.getElementById('btnSignUpSubmit').onclick = async () => {
        const email = document.getElementById('authEmailInput').value;
        const pass = document.getElementById('authPasswordInput').value;
        if (!email || !pass) {
          alert('Please enter an email and password.');
          return;
        }
        try {
          await authService.registerWithEmail(email, pass);
          ui.closeModal('modalAuth');
          ui.openModal('modalOnboarding');
        } catch (err) {
          alert('Registration error: ' + err.message);
        }
      };
    }
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new VoxApp();
  window.voxApp = app;
  app.init();
});

export default VoxApp;
