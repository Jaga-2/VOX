// Deterministic Rule-Based Financial Insight Engine for VOX
// Provides actionable observations without unsolicited advice or shaming

import { financeEngine } from './finance.js';
import { utils } from './utils.js';

export const insightEngine = {
  generateInsights(userData) {
    if (!userData) return [];

    const summary = financeEngine.computeSummary(userData);
    const insights = [];

    // 1. Budget Alerts (80% and 100%)
    summary.budgetStatusList.forEach(bgt => {
      if (bgt.percentage >= 100) {
        insights.push({
          id: `ins_bgt_max_${bgt.id}`,
          type: 'warning',
          icon: '⚠️',
          title: `${bgt.category} Budget Reached`,
          message: `You have reached 100% of your ${utils.formatINR(bgt.limit)} ${bgt.category} budget for this month. Remaining: ${utils.formatINR(0)}.`,
          priority: 1
        });
      } else if (bgt.percentage >= 80) {
        insights.push({
          id: `ins_bgt_warn_${bgt.id}`,
          type: 'warning',
          icon: '📊',
          title: `Approaching ${bgt.category} Budget`,
          message: `You've used ${bgt.percentage}% of your ${bgt.category} budget (${utils.formatINR(bgt.actualSpent)} / ${utils.formatINR(bgt.limit)}).`,
          priority: 2
        });
      }
    });

    // 2. Upcoming Essential Bills Alert
    const upcoming = (userData.bills || []).filter(b => b.status !== 'paid');
    upcoming.forEach(bill => {
      const days = utils.daysUntil(bill.dueDate);
      if (days >= 0 && days <= 7) {
        insights.push({
          id: `ins_bill_${bill.id}`,
          type: 'info',
          icon: '📅',
          title: `Upcoming: ${bill.name}`,
          message: `${utils.formatINR(bill.amount)} is due ${days === 0 ? 'today' : 'in ' + days + ' days'}. Funds are factored into your Safe-to-Spend.`,
          priority: 2
        });
      }
    });

    // 3. Today's Spending vs Average
    const dailyAvg = Math.round(summary.monthlyExpense / Math.max(1, new Date().getDate()));
    if (summary.todayExpense > dailyAvg * 1.3 && summary.todayExpense > 500) {
      const diff = summary.todayExpense - dailyAvg;
      insights.push({
        id: 'ins_today_high',
        type: 'observation',
        icon: '📈',
        title: "Today's Spending Trend",
        message: `Today's spending (${utils.formatINR(summary.todayExpense)}) is ${utils.formatINR(diff)} higher than your daily average this month (${utils.formatINR(dailyAvg)}).`,
        priority: 3
      });
    }

    // 4. Subscriptions Intelligence
    const subs = userData.subscriptions || [];
    if (subs.length > 0) {
      const monthlySubTotal = subs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      const annualSubTotal = monthlySubTotal * 12;
      insights.push({
        id: 'ins_subs_total',
        type: 'tip',
        icon: '🔁',
        title: "Active Subscriptions",
        message: `Your ${subs.length} recurring subscriptions total ${utils.formatINR(monthlySubTotal)}/month (approximately ${utils.formatINR(annualSubTotal)}/year).`,
        priority: 4
      });
    }

    // 5. Emergency Fund & Savings Progress
    const emergencyGoal = (userData.goals || []).find(g => g.name?.toLowerCase().includes('emergency'));
    if (emergencyGoal) {
      const pct = Math.round((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100);
      insights.push({
        id: 'ins_goal_emergency',
        type: 'success',
        icon: '🛡️',
        title: "Emergency Cushion Progress",
        message: `Your ${emergencyGoal.name} is ${pct}% funded (${utils.formatINR(emergencyGoal.currentAmount)} / ${utils.formatINR(emergencyGoal.targetAmount)}).`,
        priority: 4
      });
    }

    // Sort by priority (1 is most important)
    return insights.sort((a, b) => (a.priority || 5) - (b.priority || 5));
  }
};

export default insightEngine;
