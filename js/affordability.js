// VOX Innovation 1: Deterministic Factual Affordability Engine
// Strictly provides facts and trade-offs. NEVER pushes user or says "Buy it" / "Don't buy it".

import { financeEngine } from './finance.js';
import { utils } from './utils.js';

export const affordability = {
  checkAffordability(amountInput, itemName = 'item', userData, lang = 'en-IN') {
    const cost = Math.max(0, parseFloat(amountInput) || 0);
    const summary = financeEngine.computeSummary(userData);
    const isTamil = lang === 'ta-IN';

    const availableBefore = summary.liquidAvailableBalance;
    const availableAfter = Math.max(0, availableBefore - cost);
    const deficit = cost > availableBefore ? cost - availableBefore : 0;

    // Safe-to-spend impact
    const safeTodayBefore = summary.safeToSpendToday;
    const safeMonthlyBefore = summary.safeToSpendMonthly;
    const safeMonthlyAfter = Math.max(0, safeMonthlyBefore - cost);
    const safeTodayAfter = Math.round(safeMonthlyAfter / Math.max(1, summary.daysRemaining));

    // Upcoming essential bills check
    const rentBill = (userData.bills || []).find(b => b.category?.toLowerCase() === 'rent' || b.name?.toLowerCase().includes('rent') || b.name?.includes('வாடகை'));
    const rentAmount = rentBill ? rentBill.amount : 8000;
    const rentDays = rentBill ? (billDaysAway(rentBill.dueDate) || 5) : 5;

    // Savings goal impact calculation
    const emergencyGoal = (userData.goals || []).find(g => g.name?.toLowerCase().includes('emergency') || g.name?.includes('அவசர')) || (userData.goals || [])[0];
    let goalDelayDays = 0;
    if (emergencyGoal) {
      const dailySavingsRate = 130;
      goalDelayDays = Math.ceil(cost / dailySavingsRate);
    }

    // Fact bullet points
    let facts = [];
    if (isTamil) {
      facts = [
        `தற்போது உங்களிடம் ${utils.formatINR(availableBefore)} செலவிடக்கூடிய இருப்பு உள்ளது.`,
        rentBill ? `வாடகை ${utils.formatINR(rentAmount)} இன்னும் ${rentDays} நாட்களில் செலுத்த வேண்டும்.` : `வரவிருக்கும் கட்டணங்கள் மொத்தம் ${utils.formatINR(summary.upcomingBillsTotal)}.`,
        `இன்றைய உங்கள் பாதுகாப்பான செலவுத் தொகை ${utils.formatINR(safeTodayBefore)}.`,
        `${utils.formatINR(cost)} செலவுக்குப் பின், உங்கள் இருப்புத் தொகை ${utils.formatINR(availableAfter)} ஆக இருக்கும்.`,
        emergencyGoal ? `உங்கள் "${emergencyGoal.name}" சேமிப்பு இலக்கு சுமார் ${goalDelayDays} நாட்கள் தாமதமாகலாம்.` : `உங்கள் சேமிப்பு இருப்பு ${utils.formatINR(cost)} குறையும்.`
      ];
      if (deficit > 0) {
        facts.unshift(`இந்த செலவு உங்கள் தற்போதைய இருப்பை விட ${utils.formatINR(deficit)} அதிகமாக உள்ளது.`);
      }
    } else {
      facts = [
        `You currently have ${utils.formatINR(availableBefore)} available liquid balance.`,
        rentBill ? `Rent of ${utils.formatINR(rentAmount)} is due in ${rentDays} days.` : `Upcoming bills total ${utils.formatINR(summary.upcomingBillsTotal)}.`,
        `Your safe-to-spend amount today is ${utils.formatINR(safeTodayBefore)}.`,
        `After a ${utils.formatINR(cost)} purchase, your available balance would become ${utils.formatINR(availableAfter)}.`,
        emergencyGoal ? `Your "${emergencyGoal.name}" goal may be delayed by approximately ${goalDelayDays} days.` : `Your discretionary buffer will be reduced by ${utils.formatINR(cost)}.`
      ];
      if (deficit > 0) {
        facts.unshift(`This purchase exceeds your current liquid funds by ${utils.formatINR(deficit)}.`);
      }
    }

    const neutralGuidance = isTamil ?
      "நீங்கள் தீர்மானிக்க உதவும் உண்மையான எண்கள் இவை." :
      "Here are the numbers to help you decide.";

    return {
      item: itemName,
      cost,
      availableBefore,
      availableAfter,
      safeTodayBefore,
      safeTodayAfter,
      rentAmount,
      rentDays,
      goalName: emergencyGoal ? emergencyGoal.name : 'Savings Goal',
      goalDelayDays,
      deficit,
      facts,
      neutralGuidance,
      timestamp: new Date().toISOString()
    };
  }
};

function billDaysAway(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target - now;
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export default affordability;
