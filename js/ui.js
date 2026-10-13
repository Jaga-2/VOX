// UI Component Controller & Renderer for VOX MVP
// Enhanced with bilingual English & Tamil localization, linked Purchase Memory, and multi-item cash reconciliation

import { utils } from './utils.js';
import { financeEngine } from './finance.js';
import { affordability } from './affordability.js';
import { reconciliation } from './reconciliation.js';
import { worthit } from './worthit.js';
import { insightEngine } from './insights.js';
import { i18n } from './i18n.js';
import { languageParser } from './languageParser.js';

export const ui = {
  activeTab: 'home',
  currentModal: null,

  init(handlers = {}) {
    this.handlers = handlers;
    i18n.init();
    this.bindGlobalEvents();
  },

  bindGlobalEvents() {
    // Bottom Nav Click Handlers
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Elevated Voice Orb in Bottom Nav
    const centerOrb = document.getElementById('navCenterOrb');
    if (centerOrb) {
      centerOrb.addEventListener('click', () => {
        this.switchTab('voice');
        if (this.handlers.onVoiceOrbTap) this.handlers.onVoiceOrbTap();
      });
    }

    // Modal Close Backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop.id);
        }
      });
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-screen').forEach(scr => scr.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    const targetScreen = document.getElementById(`tab-${tabName}`);
    if (targetScreen) targetScreen.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navBtn) navBtn.classList.add('active');

    const contentArea = document.querySelector('.app-content');
    if (contentArea) contentArea.scrollTop = 0;
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.currentModal = modalId;
    }
  },

  closeModal(modalId) {
    const target = modalId ? document.getElementById(modalId) : document.querySelector('.modal-backdrop.active');
    if (target) {
      target.classList.remove('active');
      this.currentModal = null;
    }
  },

  // -------------------------------------------------------------
  // RENDER HOME DASHBOARD (Section 10)
  // -------------------------------------------------------------
  renderDashboard(userData) {
    const summary = financeEngine.computeSummary(userData);
    const profile = userData.profile || {};
    const insights = insightEngine.generateInsights(userData);
    const isTamil = i18n.currentLang === 'ta-IN';

    // Profile greeting
    const greetingEl = document.getElementById('dashGreeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      const timeKey = hour < 12 ? 'greeting_morning' : (hour < 17 ? 'greeting_afternoon' : 'greeting_evening');
      const timeWord = i18n.t(timeKey);
      const name = profile.name ? profile.name.split(' ')[0] : 'there';
      greetingEl.innerHTML = `${timeWord}, ${name} 👋`;
    }

    // Demo badge
    const demoTag = document.getElementById('demoTag');
    if (demoTag) {
      demoTag.style.display = (profile.isDemo || userData.isDemo) ? 'inline-block' : 'none';
      demoTag.innerText = i18n.t('brand_demo_tag');
    }

    // Top Balance Card
    const balEl = document.getElementById('dashAvailableBalance');
    if (balEl) balEl.innerText = utils.formatINR(summary.liquidAvailableBalance);

    const netWorthEl = document.getElementById('dashNetWorth');
    if (netWorthEl) netWorthEl.innerText = utils.formatINR(summary.netWorth);

    const monthIncomeEl = document.getElementById('dashMonthIncome');
    if (monthIncomeEl) monthIncomeEl.innerText = `+${utils.formatINR(summary.monthlyIncome)}`;

    const monthExpenseEl = document.getElementById('dashMonthExpense');
    if (monthExpenseEl) monthExpenseEl.innerText = `-${utils.formatINR(summary.monthlyExpense)}`;

    // Safe-to-Spend banner
    const safeSpendTodayEl = document.getElementById('dashSafeSpendToday');
    if (safeSpendTodayEl) safeSpendTodayEl.innerText = utils.formatINR(summary.safeToSpendToday);

    const todaySpendEl = document.getElementById('dashTodaySpend');
    if (todaySpendEl) todaySpendEl.innerText = utils.formatINR(summary.todayExpense);

    // Upcoming essential bills
    const upcomingContainer = document.getElementById('dashUpcomingBillsList');
    if (upcomingContainer) {
      const upcoming = summary.upcomingBillsList.slice(0, 3);
      if (upcoming.length === 0) {
        upcomingContainer.innerHTML = `<p style="font-size:12px; color:var(--text-muted); padding:6px 0;">${isTamil ? 'அடுத்து வரும் கட்டணங்கள் ஏதுமில்லை.' : 'No upcoming bills due soon.'}</p>`;
      } else {
        upcomingContainer.innerHTML = upcoming.map(b => {
          const days = utils.daysUntil(b.dueDate);
          const timeText = days === 0 ? i18n.t('due_today') : (days === 1 ? (isTamil ? '1 நாள் மீதம்' : '1 day left') : `${days} ${i18n.t('days_left')}`);
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
              <div>
                <span style="font-size:13px; font-weight:600; color:#FFFFFF;">${b.name}</span>
                <span style="font-size:11px; color:var(--amber); margin-left:8px;">${timeText}</span>
              </div>
              <span style="font-size:13px; font-weight:700; color:var(--text-primary);">${utils.formatINR(b.amount)}</span>
            </div>
          `;
        }).join('');
      }
    }

    // Budget Status preview
    const budgetListContainer = document.getElementById('dashBudgetList');
    if (budgetListContainer) {
      const topBudgets = summary.budgetStatusList.slice(0, 3);
      budgetListContainer.innerHTML = topBudgets.map(b => `
        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>${b.icon || '🏷️'} ${b.category}</span>
            <span style="color:${b.percentage >= 80 ? 'var(--coral)' : 'var(--text-secondary)'}; font-weight:600;">
              ${utils.formatINR(b.actualSpent)} / ${utils.formatINR(b.limit)} (${b.percentage}%)
            </span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${b.percentage >= 100 ? 'fill-coral' : (b.percentage >= 80 ? 'fill-amber' : 'fill-mint')}" 
                 style="width: ${Math.min(100, b.percentage)}%;"></div>
          </div>
        </div>
      `).join('');
    }

    // Recent Transactions
    const txContainer = document.getElementById('dashRecentTxList');
    if (txContainer) {
      const recent = (userData.transactions || []).slice(0, 4);
      if (recent.length === 0) {
        txContainer.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center; padding:14px 0;">${isTamil ? 'பரிவர்த்தனைகள் ஏதுமில்லை. பேச குரல் பொத்தானைத் தொடவும்!' : 'No transactions recorded yet. Tap the Voice Orb to log an expense!'}</p>`;
      } else {
        txContainer.innerHTML = recent.map(tx => this.renderTransactionItemHTML(tx)).join('');
      }
    }

    // Top Insight Card
    const insightBox = document.getElementById('dashTopInsight');
    if (insightBox) {
      if (insights.length > 0) {
        const topIns = insights[0];
        insightBox.innerHTML = `
          <div class="insight-header">
            <span>${topIns.icon || '💡'}</span>
            <span>${i18n.t('vox_says')}: ${topIns.title}</span>
          </div>
          <p class="insight-body">${topIns.message}</p>
        `;
        insightBox.style.display = 'block';
      } else {
        insightBox.style.display = 'none';
      }
    }
  },

  // -------------------------------------------------------------
  // RENDER MONEY SCREEN (Section 17)
  // -------------------------------------------------------------
  renderMoneyScreen(userData) {
    const summary = financeEngine.computeSummary(userData);

    const netWorthEl = document.getElementById('moneyNetWorth');
    if (netWorthEl) netWorthEl.innerText = utils.formatINR(summary.netWorth);

    const cashEl = document.getElementById('moneyCashBalance');
    if (cashEl) cashEl.innerText = utils.formatINR(summary.cashBalance);

    const digitalEl = document.getElementById('moneyDigitalBalance');
    if (digitalEl) digitalEl.innerText = utils.formatINR(summary.digitalBalance);

    const savingsEl = document.getElementById('moneySavingsBalance');
    if (savingsEl) savingsEl.innerText = utils.formatINR(summary.savingsBalance);

    // Render Account Cards
    const accountsContainer = document.getElementById('moneyAccountsList');
    if (accountsContainer) {
      accountsContainer.innerHTML = (userData.accounts || []).map(acc => {
        const icon = acc.type === 'cash' ? '💵' : (acc.type === 'savings' ? '🏦' : '📱');
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.04);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">${icon}</span>
              <div>
                <h6 style="font-size:13px; font-weight:600; color:#FFFFFF;">${acc.name}</h6>
                <p style="font-size:11px; color:var(--text-muted);">${acc.accountNumber || acc.linkedBank || (acc.type.toUpperCase())}</p>
              </div>
            </div>
            <span style="font-size:15px; font-weight:700; color:var(--text-primary);">${utils.formatINR(acc.balance)}</span>
          </div>
        `;
      }).join('');
    }

    // Render Full Transaction History
    const allTxContainer = document.getElementById('moneyAllTxList');
    if (allTxContainer) {
      const allTx = userData.transactions || [];
      if (allTx.length === 0) {
        allTxContainer.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center; padding:20px;">${i18n.t('transaction_history')} காலியாக உள்ளது.</p>`;
      } else {
        allTxContainer.innerHTML = allTx.map(tx => this.renderTransactionItemHTML(tx)).join('');
      }
    }
  },

  // -------------------------------------------------------------
  // RENDER PLAN SCREEN (Budgets, Bills, Subscriptions, Goals)
  // -------------------------------------------------------------
  renderPlanScreen(userData) {
    const summary = financeEngine.computeSummary(userData);

    // Budgets
    const budgetsContainer = document.getElementById('planBudgetsList');
    if (budgetsContainer) {
      budgetsContainer.innerHTML = summary.budgetStatusList.map(b => `
        <div class="glass-card" style="margin-bottom:10px; padding:12px 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">${b.icon || '🏷️'}</span>
              <span style="font-size:14px; font-weight:600; color:#FFF;">${b.category}</span>
            </div>
            <span style="font-size:13px; font-weight:700; color:${b.percentage >= 100 ? 'var(--coral)' : (b.percentage >= 80 ? 'var(--amber)' : 'var(--mint)')};">
              ${utils.formatINR(b.actualSpent)} / ${utils.formatINR(b.limit)}
            </span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${b.percentage >= 100 ? 'fill-coral' : (b.percentage >= 80 ? 'fill-amber' : 'fill-mint')}" 
                 style="width: ${Math.min(100, b.percentage)}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-top:4px;">
            <span>${b.percentage}% used</span>
            <span>${b.percentage >= 100 ? 'Budget reached' : `${utils.formatINR(b.remaining)} remaining`}</span>
          </div>
        </div>
      `).join('');
    }

    // Bills
    const billsContainer = document.getElementById('planBillsList');
    if (billsContainer) {
      billsContainer.innerHTML = (userData.bills || []).map(b => {
        const days = utils.daysUntil(b.dueDate);
        const isPaid = b.status === 'paid';
        return `
          <div class="glass-card" style="margin-bottom:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h6 style="font-size:14px; font-weight:600; color:#FFF;">${b.name}</h6>
              <p style="font-size:11px; color:var(--text-muted);">${b.frequency} • Due: ${utils.formatDate(b.dueDate)} (${days}d)</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px; font-weight:700; color:#FFF; margin-bottom:4px;">${utils.formatINR(b.amount)}</div>
              ${isPaid ? 
                `<span style="font-size:10px; color:var(--mint); font-weight:700;">✓ PAID</span>` :
                `<button class="btn-mark-paid chip-btn" data-id="${b.id}" style="padding:3px 8px; font-size:10px; border-color:var(--mint); color:var(--mint);">Mark Paid</button>`
              }
            </div>
          </div>
        `;
      }).join('');

      billsContainer.querySelectorAll('.btn-mark-paid').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (this.handlers.onMarkBillPaid) this.handlers.onMarkBillPaid(id);
        });
      });
    }

    // Subscriptions
    const subsContainer = document.getElementById('planSubsList');
    const subsSummaryEl = document.getElementById('planSubsSummary');
    const subs = userData.subscriptions || [];
    if (subsSummaryEl) {
      const monthlyTotal = subs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      subsSummaryEl.innerText = `You spend approximately ${utils.formatINR(monthlyTotal * 12)}/year on subscriptions (${utils.formatINR(monthlyTotal)}/month).`;
    }
    if (subsContainer) {
      subsContainer.innerHTML = subs.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:6px; border:1px solid rgba(255,255,255,0.04);">
          <div>
            <h6 style="font-size:13px; font-weight:600; color:#FFF;">${s.name}</h6>
            <p style="font-size:11px; color:var(--text-muted);">${s.billingCycle}</p>
          </div>
          <span style="font-size:14px; font-weight:700; color:#FFF;">${utils.formatINR(s.amount)}/mo</span>
        </div>
      `).join('');
    }

    // Goals
    const goalsContainer = document.getElementById('planGoalsList');
    if (goalsContainer) {
      goalsContainer.innerHTML = (userData.goals || []).map(g => {
        const pct = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));
        return `
          <div class="glass-card" style="margin-bottom:10px; padding:12px 14px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="font-size:14px; font-weight:600; color:#FFF;">${g.icon || '🎯'} ${g.name}</span>
              <span style="font-size:13px; font-weight:700; color:var(--gold);">${pct}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill fill-gold" style="width:${pct}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-top:4px;">
              <span>${utils.formatINR(g.currentAmount)} saved</span>
              <span>Target: ${utils.formatINR(g.targetAmount)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // -------------------------------------------------------------
  // RENDER GROW SCREEN
  // -------------------------------------------------------------
  renderGrowScreen() {
    const calcBtn = document.getElementById('btnSimulateGrowth');
    if (calcBtn && !calcBtn.dataset.bound) {
      calcBtn.dataset.bound = 'true';
      calcBtn.addEventListener('click', () => this.runCompoundGrowthSimulation());
    }
  },

  runCompoundGrowthSimulation() {
    const initial = parseFloat(document.getElementById('simInitial').value) || 10000;
    const monthly = parseFloat(document.getElementById('simMonthly').value) || 2000;
    const rate = (parseFloat(document.getElementById('simRate').value) || 12) / 100;
    const years = parseFloat(document.getElementById('simYears').value) || 5;

    const months = years * 12;
    const monthlyRate = rate / 12;

    let total = initial;
    let invested = initial;

    for (let m = 1; m <= months; m++) {
      total = (total + monthly) * (1 + monthlyRate);
      invested += monthly;
    }

    const gains = total - invested;

    const resultBox = document.getElementById('simResultBox');
    if (resultBox) {
      resultBox.innerHTML = `
        <div style="padding:14px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:14px; margin-top:12px; text-align:center;">
          <h5 style="font-size:12px; text-transform:uppercase; color:var(--mint); margin-bottom:4px;">${i18n.currentLang === 'ta-IN' ? 'மதிப்பிடப்பட்ட நிதி' : 'Estimated Corpus'}</h5>
          <h2 style="font-size:26px; font-weight:800; color:#FFF; margin-bottom:6px;">${utils.formatINR(total)}</h2>
          <div style="display:flex; justify-content:space-around; font-size:12px; color:var(--text-secondary); border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
            <div>${i18n.currentLang === 'ta-IN' ? 'முதலீடு' : 'Invested'}: <b style="color:#FFF;">${utils.formatINR(invested)}</b></div>
            <div>${i18n.currentLang === 'ta-IN' ? 'வளர்ச்சி ஆதாயம்' : 'Wealth Gain'}: <b style="color:var(--mint);">${utils.formatINR(gains)}</b></div>
          </div>
        </div>
      `;
    }
  },

  // -------------------------------------------------------------
  // CONFIRMATION MODAL (Section 15: Never Guess Silently)
  // -------------------------------------------------------------
  showConfirmationCard(parsedData, onConfirm, onEdit, onCancel) {
    const modal = document.getElementById('modalConfirmation');
    const content = document.getElementById('confirmationCardContent');
    if (!modal || !content) return;

    const isExpense = parsedData.type === 'expense';
    const typeLabel = isExpense ? (i18n.currentLang === 'ta-IN' ? 'செலவு' : 'Expense') : (i18n.currentLang === 'ta-IN' ? 'வருமானம்' : 'Income');
    const typeClass = isExpense ? 'coral' : 'mint';

    content.innerHTML = `
      <div class="confirm-preview-box">
        <div class="preview-row">
          <span class="preview-label">${i18n.t('type')}</span>
          <span class="preview-val ${typeClass}">${typeLabel}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('amount')}</span>
          <span class="preview-val" style="font-size:18px; font-weight:800;">${utils.formatINR(parsedData.amount)}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('category')}</span>
          <span class="preview-val">${parsedData.category || 'General'}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('payment_method')}</span>
          <span class="preview-val">${parsedData.paymentMethod || 'UPI'}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('date')}</span>
          <span class="preview-val">${utils.formatDate(new Date())}</span>
        </div>
        ${parsedData.hasWorthIt ? `
          <div class="preview-row" style="color:var(--violet);">
            <span class="preview-label">${i18n.currentLang === 'ta-IN' ? '30 நாள் மறுஆய்வு' : 'Worth-It Follow-up'}</span>
            <span class="preview-val">${i18n.currentLang === 'ta-IN' ? 'இயக்கப்பட்டது (30 நாட்கள்)' : 'Enabled (30 days)'}</span>
          </div>
        ` : ''}
        <div class="transcript-quote">
          " ${parsedData.originalTranscript || ''} "
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" id="btnCancelConfirm">${i18n.t('cancel')}</button>
        <button class="btn btn-primary" id="btnApproveConfirm">${i18n.t('confirm')}</button>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('btnApproveConfirm').onclick = () => {
      modal.classList.remove('active');
      if (onConfirm) onConfirm(parsedData);
    };
    document.getElementById('btnCancelConfirm').onclick = () => {
      modal.classList.remove('active');
      if (onCancel) onCancel();
    };
  },

  // -------------------------------------------------------------
  // INNOVATION 1: CAN I AFFORD IT? MODAL / CARD (Section 23)
  // -------------------------------------------------------------
  showAffordabilityCard(affordData) {
    const modal = document.getElementById('modalAffordability');
    const content = document.getElementById('affordabilityCardContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <span style="font-size:36px;">🧥</span>
        <h3 style="font-size:18px; font-weight:700; color:#FFF; margin-top:6px;">${i18n.t('afford_title')} ${affordData.item}?</h3>
        <p style="font-size:24px; font-weight:800; color:var(--violet); margin:4px 0;">${utils.formatINR(affordData.cost)}</p>
      </div>

      <div class="confirm-preview-box">
        <h5 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px; font-weight:700;">${i18n.t('afford_facts_title')}</h5>
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
          ${affordData.facts.map(f => `
            <li style="font-size:13px; color:#E2E8F0; display:flex; align-items:flex-start; gap:8px;">
              <span style="color:var(--cyan); font-weight:bold;">•</span>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.25); border-radius:12px; padding:12px; margin-bottom:14px; text-align:center;">
        <p style="font-size:13px; font-weight:600; color:#D8B4FE;">
          "${affordData.neutralGuidance}"
        </p>
      </div>

      <button class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('modalAffordability').classList.remove('active')">
        ${i18n.t('close_analysis')}
      </button>
    `;

    modal.classList.add('active');
  },

  // -------------------------------------------------------------
  // INNOVATION 2: DAILY SPENDING LOG MODAL (Section 24)
  // -------------------------------------------------------------
  showDailyLogModal(userData, onConfirmLog, onAddMissing) {
    const modal = document.getElementById('modalDailyLog');
    const content = document.getElementById('dailyLogContent');
    if (!modal || !content) return;

    const summary = financeEngine.computeSummary(userData);
    const isTamil = i18n.currentLang === 'ta-IN';

    // Compute today's breakdown
    const todayStr = new Date().toDateString();
    const todayTxs = (userData.transactions || []).filter(tx => {
      const d = new Date(tx.timestamp || tx.createdAt);
      return d.toDateString() === todayStr && tx.type === 'expense';
    });

    const categoryTotals = {};
    let largestTx = null;

    todayTxs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      if (!largestTx || amt > largestTx.amount) {
        largestTx = tx;
      }
    });

    content.innerHTML = `
      <div style="text-align:center; margin-bottom:14px;">
        <span style="font-size:32px;">🌙</span>
        <h3 style="font-size:18px; font-weight:700; color:#FFF; margin-top:4px;">${i18n.t('daily_log_title')}</h3>
        <p style="font-size:12px; color:var(--text-muted);">${utils.formatDate(new Date())} • ${todayTxs.length} ${isTamil ? 'பரிவர்த்தனைகள்' : 'transactions'}</p>
      </div>

      <div class="confirm-preview-box">
        <h5 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">${i18n.t('daily_log_breakdown')}</h5>
        ${Object.keys(categoryTotals).length === 0 ? 
          `<p style="font-size:13px; color:var(--text-muted); padding:4px 0;">${isTamil ? 'இன்று செலவுகள் ஏதும் பதிவு செய்யப்படவில்லை.' : 'No expenses recorded yet today.'}</p>` :
          Object.entries(categoryTotals).map(([cat, amt]) => `
            <div class="preview-row">
              <span class="preview-label">${cat}</span>
              <span class="preview-val">${utils.formatINR(amt)}</span>
            </div>
          `).join('')
        }
        <div class="preview-row" style="border-top:1px solid rgba(255,255,255,0.1); margin-top:8px; padding-top:8px;">
          <span class="preview-label" style="font-weight:700; color:#FFF;">${isTamil ? 'இன்றைய மொத்த செலவு' : 'Total Spent Today'}</span>
          <span class="preview-val coral" style="font-size:16px;">${utils.formatINR(summary.todayExpense)}</span>
        </div>
        ${largestTx ? `
          <div class="preview-row">
            <span class="preview-label">${i18n.t('daily_log_largest')}</span>
            <span class="preview-val">${largestTx.category} — ${utils.formatINR(largestTx.amount)}</span>
          </div>
        ` : ''}
      </div>

      <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25); border-radius:12px; padding:12px; margin-bottom:16px; text-align:center;">
        <p style="font-size:13px; font-weight:600; color:#A5F3FC;">
          "${i18n.t('daily_log_missing_prompt')}"
        </p>
      </div>

      <div class="btn-group">
        <button class="btn btn-secondary" id="btnDailyLogAddMissing">${i18n.t('btn_add_missing')}</button>
        <button class="btn btn-primary" id="btnDailyLogDone">${i18n.t('btn_done')}</button>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('btnDailyLogAddMissing').onclick = () => {
      modal.classList.remove('active');
      if (onAddMissing) onAddMissing();
    };
    document.getElementById('btnDailyLogDone').onclick = () => {
      modal.classList.remove('active');
      if (onConfirmLog) onConfirmLog();
    };
  },

  // -------------------------------------------------------------
  // INNOVATION 3: CASH RECONCILIATION MODAL (Section 25 & 26)
  // -------------------------------------------------------------
  showReconciliationModal(userData, onConfirmRecon) {
    const modal = document.getElementById('modalReconciliation');
    const content = document.getElementById('reconciliationContent');
    if (!modal || !content) return;

    const cashAccount = (userData.accounts || []).find(a => a.type === 'cash') || { balance: 125 };
    const expectedCash = cashAccount.balance;
    const isTamil = i18n.currentLang === 'ta-IN';

    content.innerHTML = `
      <div style="text-align:center; margin-bottom:14px;">
        <span style="font-size:32px;">💵</span>
        <h3 style="font-size:18px; font-weight:700; color:#FFF; margin-top:4px;">${i18n.t('reconcile_title')}</h3>
        <p style="font-size:12px; color:var(--text-muted);">${i18n.t('reconcile_sub')}</p>
      </div>

      <div class="form-group">
        <label class="form-label">${i18n.t('how_much_cash')}</label>
        <input type="number" id="reconCountedInput" class="form-control" placeholder="e.g. 100" value="100" style="font-size:18px; font-weight:700;">
      </div>

      <div id="reconCalcResults" class="confirm-preview-box" style="margin-top:12px;"></div>

      <!-- Multi-item custom entry bar -->
      <div class="form-group" style="margin-top:10px;">
        <label class="form-label">${isTamil ? 'விடுபட்ட ரொக்கச் செலவுகளை விவரிக்கவும் (எ.கா. ₹10 தண்ணீர் மற்றும் ₹15 தின்பண்டங்கள்):' : 'Or describe missing cash items (e.g. ₹10 water and ₹15 snacks):'}</label>
        <input type="text" id="reconMultiItemsInput" class="form-control" placeholder="${isTamil ? '10 ரூபாய் தண்ணீர் மற்றும் 15 ரூபாய் தின்பண்டங்கள்' : '₹10 water and ₹15 snacks'}">
      </div>

      <div id="reconSuggestionsBox" style="margin-bottom:14px;"></div>

      <div class="btn-group">
        <button class="btn btn-secondary" onclick="document.getElementById('modalReconciliation').classList.remove('active')">${i18n.t('cancel')}</button>
        <button class="btn btn-primary" id="btnConfirmRecon">${i18n.t('btn_confirm_reconcile')}</button>
      </div>
    `;

    const input = document.getElementById('reconCountedInput');
    const multiInput = document.getElementById('reconMultiItemsInput');
    const resultsBox = document.getElementById('reconCalcResults');
    const suggestionsBox = document.getElementById('reconSuggestionsBox');

    let currentMissingItems = [];

    const updateCalc = () => {
      const counted = parseFloat(input.value) || 0;
      const res = reconciliation.calculateCashDifference(expectedCash, counted);

      resultsBox.innerHTML = `
        <div class="preview-row">
          <span class="preview-label">${i18n.t('expected_cash')}</span>
          <span class="preview-val">${utils.formatINR(expectedCash)}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('counted_cash')}</span>
          <span class="preview-val">${utils.formatINR(counted)}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">${i18n.t('difference')}</span>
          <span class="preview-val ${res.difference > 0 ? 'coral' : 'mint'}" style="font-size:15px; font-weight:700;">
            ${utils.formatINR(Math.abs(res.difference))} ${res.difference > 0 ? `(${i18n.t('shortage')})` : (res.difference < 0 ? `(${i18n.t('surplus')})` : '')}
          </span>
        </div>
      `;

      if (res.difference > 0) {
        const suggestions = reconciliation.suggestMissingCashTransactions(res.difference);
        suggestionsBox.innerHTML = `
          <label class="form-label" style="margin-bottom:6px;">${i18n.t('forgot_cash_prompt')}</label>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${suggestions.map((s, idx) => `
              <div class="chip-btn" data-idx="${idx}" style="justify-content:space-between; border-radius:10px; padding:8px 12px;">
                <span>${s.description}</span>
                <span style="color:var(--violet);">${isTamil ? 'தேர்ந்தெடு' : 'Select'}</span>
              </div>
            `).join('')}
          </div>
        `;

        suggestionsBox.querySelectorAll('.chip-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            currentMissingItems = suggestions[idx]?.items || [];
            btn.classList.toggle('active');
            if (multiInput) {
              multiInput.value = suggestions[idx]?.description || '';
            }
          });
        });
      } else {
        suggestionsBox.innerHTML = `<p style="font-size:12px; color:var(--mint); text-align:center; padding:6px 0;">✓ ${isTamil ? 'ரொக்க இருப்பு சரியாக பொருந்துகிறது!' : 'Cash balances match!'}</p>`;
      }
    };

    input.addEventListener('input', updateCalc);

    multiInput.addEventListener('input', () => {
      const parsed = languageParser.extractMultipleItems(multiInput.value);
      if (parsed.length > 0) {
        currentMissingItems = parsed;
      }
    });

    updateCalc();
    modal.classList.add('active');

    document.getElementById('btnConfirmRecon').onclick = () => {
      const counted = parseFloat(input.value) || 0;
      modal.classList.remove('active');
      if (onConfirmRecon) onConfirmRecon(expectedCash, counted, currentMissingItems);
    };
  },

  // -------------------------------------------------------------
  // INNOVATION 4: "WORTH-IT" PURCHASE MEMORY & HISTORY MODAL (Section 27)
  // -------------------------------------------------------------
  showWorthItModal(userData, onSaveRating) {
    const modal = document.getElementById('modalWorthIt');
    const content = document.getElementById('worthItContent');
    if (!modal || !content) return;

    const pending = worthit.getPendingReviews(userData.worthItItems || []);
    const reviewed = worthit.getReviewedHistory(userData.worthItItems || []);
    const stats = worthit.computeSatisfactionStats(userData.worthItItems || []);
    const isTamil = i18n.currentLang === 'ta-IN';

    let pendingHTML = '';
    if (pending.length === 0) {
      pendingHTML = `
        <div style="text-align:center; padding:16px 0;">
          <span style="font-size:32px;">✨</span>
          <h4 style="font-size:16px; font-weight:700; color:#FFF; margin-top:4px;">${i18n.t('worth_it_all_caught_up')}</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${i18n.t('worth_it_no_pending')}</p>
        </div>
      `;
    } else {
      const target = pending[0];
      pendingHTML = `
        <div style="text-align:center; margin-bottom:14px;">
          <span style="font-size:34px;">🎧</span>
          <h3 style="font-size:17px; font-weight:700; color:#FFF; margin-top:4px;">${i18n.t('worth_it_title')}</h3>
          <p style="font-size:13px; color:#CBD5E1; margin:8px 0; line-height:1.45;">
            "${isTamil ? 
              `நீங்கள் ஒரு மாதத்திற்கு முன்பு <b>${target.item}</b> பொருளை <b>${utils.formatINR(target.amount)}</b> ரூபாய்க்கு வாங்கினீர்கள். இந்த வாங்குதலில் நீங்கள் மகிழ்ச்சியடைகிறீர்களா?` : 
              `You bought <b>${target.item}</b> for <b>${utils.formatINR(target.amount)}</b> last month. Are you happy with this purchase?`}"
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
          <button class="btn btn-secondary btn-rate" data-rating="very_happy" style="padding:10px 8px; flex-direction:column; gap:4px;">
            <span style="font-size:22px;">😊</span>
            <span style="font-size:11px;">${i18n.t('rate_very_happy')}</span>
          </button>
          <button class="btn btn-secondary btn-rate" data-rating="happy" style="padding:10px 8px; flex-direction:column; gap:4px;">
            <span style="font-size:22px;">🙂</span>
            <span style="font-size:11px;">${i18n.t('rate_happy')}</span>
          </button>
          <button class="btn btn-secondary btn-rate" data-rating="neutral" style="padding:10px 8px; flex-direction:column; gap:4px;">
            <span style="font-size:22px;">😐</span>
            <span style="font-size:11px;">${i18n.t('rate_neutral')}</span>
          </button>
          <button class="btn btn-secondary btn-rate" data-rating="not_worth_it" style="padding:10px 8px; flex-direction:column; gap:4px;">
            <span style="font-size:22px;">🙁</span>
            <span style="font-size:11px; color:var(--coral);">${i18n.t('rate_not_worth_it')}</span>
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">${isTamil ? 'மறுஆய்வு குறிப்பு (விருப்பம்):' : 'Optional reflection note:'}</label>
          <input type="text" id="worthItNoteInput" class="form-control" placeholder="${isTamil ? 'எ.கா. சிறந்த ஒலி தரம், தினமும் பயன்படுத்துகிறேன்' : 'e.g. Great audio quality, use it every day'}">
        </div>
      `;
    }

    // Purchase History & Wisdom List
    const historyHTML = `
      <div style="margin-top:16px; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="font-size:13px; font-weight:700; color:#FFF;">${isTamil ? 'கொள்முதல் மறுஆய்வு வரலாறு' : 'Purchase Satisfaction History'}</h5>
          <span style="font-size:11px; color:var(--mint); font-weight:700;">${stats.satisfactionRate}% ${isTamil ? 'திருப்தி' : 'Satisfied'}</span>
        </div>
        ${reviewed.length === 0 ? 
          `<p style="font-size:12px; color:var(--text-muted);">${isTamil ? 'முந்தைய மறுஆய்வுகள் ஏதுமில்லை.' : 'No completed reviews yet.'}</p>` :
          reviewed.map(item => {
            const isHappy = item.rating === 'very_happy' || item.rating === 'happy';
            const icon = item.rating === 'very_happy' ? '😊' : (item.rating === 'happy' ? '🙂' : (item.rating === 'neutral' ? '😐' : '🙁'));
            const statusLabel = isHappy ? (isTamil ? 'பயனுள்ளது' : 'Worth it') : (item.rating === 'neutral' ? (isTamil ? 'நடுநிலை' : 'Neutral') : (isTamil ? 'பயனில்லை' : 'Not worth it'));
            return `
              <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:6px; font-size:12px; border:1px solid rgba(255,255,255,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <span style="font-size:14px;">${icon}</span>
                    <b style="color:#FFF; margin-left:4px;">${item.item}</b>
                    <span style="color:var(--text-muted); font-size:11px; margin-left:6px;">(${utils.formatINR(item.amount)})</span>
                  </div>
                  <span style="font-weight:700; color:${isHappy ? 'var(--mint)' : (item.rating === 'neutral' ? 'var(--amber)' : 'var(--coral)')}; font-size:11px;">
                    ${statusLabel}
                  </span>
                </div>
                ${item.notes ? `<p style="font-size:11px; color:var(--text-secondary); margin-top:4px; font-style:italic;">"${item.notes}"</p>` : ''}
                <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">
                  Purchased: ${item.purchaseDate || 'Earlier'} • Reviewed: ${item.reviewDate || 'Recently'}
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;

    content.innerHTML = `
      ${pendingHTML}
      ${historyHTML}
      <button class="btn btn-secondary" style="width:100%; margin-top:14px;" onclick="document.getElementById('modalWorthIt').classList.remove('active')">
        ${i18n.t('skip_later')}
      </button>
    `;

    content.querySelectorAll('.btn-rate').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.dataset.rating;
        const note = document.getElementById('worthItNoteInput')?.value || '';
        modal.classList.remove('active');
        if (onSaveRating && pending[0]) onSaveRating(pending[0].id, rating, note);
      });
    });

    modal.classList.add('active');
  },

  // -------------------------------------------------------------
  // WHATSAPP-STYLE CONVERSATIONAL CHAT (Section 28)
  // -------------------------------------------------------------
  addChatMessage(speaker, text) {
    const container = document.getElementById('chatMessagesBox');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${speaker === 'vox' ? 'bubble-vox' : 'bubble-user'}`;
    bubble.innerHTML = `
      <div class="chat-speaker">${speaker === 'vox' ? 'VOX Assistant' : 'You'}</div>
      <div>${text}</div>
    `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  // Helper: Individual transaction item HTML
  renderTransactionItemHTML(tx) {
    const isExpense = tx.type === 'expense';
    const amountClass = isExpense ? 'expense' : 'income';
    const sign = isExpense ? '-' : '+';
    const catIcons = {
      Groceries: '🛒',
      Food: '🍔',
      Rent: '🏠',
      Transport: '🚇',
      Entertainment: '🎬',
      Salary: '💼',
      Utilities: '⚡',
      Electronics: '🎧',
      Shopping: '🛍️'
    };
    const icon = catIcons[tx.category] || '💸';

    return `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon">${icon}</div>
          <div class="tx-details">
            <h5>${tx.category || 'Transaction'}</h5>
            <p>${tx.merchant || tx.paymentMethod || 'Manual'} • ${utils.formatDate(tx.timestamp || tx.createdAt)}</p>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="tx-amount ${amountClass}">${sign}${utils.formatINR(tx.amount)}</div>
          <span class="tx-time">${tx.paymentMethod || ''}</span>
        </div>
      </div>
    `;
  }
};

export default ui;
