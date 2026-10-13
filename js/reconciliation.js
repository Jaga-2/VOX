// VOX Innovation 3: Cash Reconciliation Engine
// Reconciles wallet cash discrepancies, suggests forgotten micro-purchases, and never auto-saves without confirmation

import { utils } from './utils.js';

export const reconciliation = {
  // Calculate difference between expected wallet cash and counted physical cash
  calculateCashDifference(expectedCash, countedCash) {
    const expected = Number(expectedCash) || 0;
    const counted = Number(countedCash) || 0;
    const difference = expected - counted;

    return {
      expectedCash: expected,
      countedCash: counted,
      difference,
      hasDiscrepancy: Math.abs(difference) > 0,
      isShortage: difference > 0, // Spent money not yet recorded
      isSurplus: difference < 0   // Received cash not yet recorded
    };
  },

  // Intelligently suggest common micro-cash purchases for missing amount
  suggestMissingCashTransactions(difference) {
    const diff = Math.abs(Number(difference) || 0);
    if (diff === 0) return [];

    const commonCashPresets = [
      { label: "Water Bottle", amount: 10, category: "Food", icon: "💧" },
      { label: "Chai / Tea & Biscuit", amount: 15, category: "Food", icon: "☕" },
      { label: "Snacks / Samosa", amount: 20, category: "Food", icon: "🥨" },
      { label: "Auto / Bus Fare", amount: 25, category: "Transport", icon: "🛺" },
      { label: "Fruit / Juice", amount: 30, category: "Food", icon: "🥤" },
      { label: "Cigarettes / Paan", amount: 18, category: "Other", icon: "🚬" },
      { label: "Local Vegetable vendor", amount: 50, category: "Groceries", icon: "🥦" },
      { label: "Xerox / Printouts", amount: 5, category: "Education", icon: "📄" }
    ];

    // Find combination or single match
    const suggestions = [];

    // Exact single match
    const exact = commonCashPresets.find(p => p.amount === diff);
    if (exact) {
      suggestions.push({
        description: `₹${diff} ${exact.label}`,
        items: [exact]
      });
    }

    // Pair combination (e.g. ₹10 water + ₹15 tea = ₹25)
    for (let i = 0; i < commonCashPresets.length; i++) {
      for (let j = i; j < commonCashPresets.length; j++) {
        const itemA = commonCashPresets[i];
        const itemB = commonCashPresets[j];
        if (itemA.amount + itemB.amount === diff) {
          suggestions.push({
            description: `${utils.formatINR(itemA.amount)} ${itemA.label} + ${utils.formatINR(itemB.amount)} ${itemB.label}`,
            items: [itemA, itemB]
          });
          if (suggestions.length >= 3) break;
        }
      }
      if (suggestions.length >= 3) break;
    }

    // Default item if no exact combo found
    if (suggestions.length === 0) {
      suggestions.push({
        description: `Unlogged cash expenses totaling ${utils.formatINR(diff)}`,
        items: [{ label: "Miscellaneous Cash Expense", amount: diff, category: "Other", icon: "💵" }]
      });
    }

    return suggestions;
  },

  // Format confirmation message (Bilingual)
  formatReconciliationResponse(expected, counted, missingItems = [], lang = 'en-IN') {
    const diff = expected - counted;
    const isTamil = lang === 'ta-IN';

    if (diff === 0) {
      return isTamil ?
        `கையில் உள்ள பணம் கணக்குடன் சரியாகப் பொருந்துகிறது: ${utils.formatINR(counted)}.` :
        `Your cash in hand matches your recorded transactions perfectly at ${utils.formatINR(counted)}.`;
    }

    if (missingItems.length > 0) {
      const itemsText = missingItems.map(i => `${utils.formatINR(i.amount)} ${i.label}`).join(' + ');
      const totalItems = missingItems.reduce((acc, curr) => acc + curr.amount, 0);
      return isTamil ?
        `${itemsText} = ${utils.formatINR(totalItems)}. உங்கள் ரொக்க இருப்பு இப்போது ${utils.formatINR(counted)} ஆக சரிசெய்யப்பட்டது.` :
        `${itemsText} = ${utils.formatINR(totalItems)}. Your cash balance now reconciles to ${utils.formatINR(counted)}.`;
    }

    return isTamil ?
      `எதிர்பார்க்கப்பட்ட தொகை ${utils.formatINR(expected)}. ${utils.formatINR(diff)} வித்தியாசம் உள்ளது. இன்று ஏதேனும் ரொக்கச் செலவு செய்தீர்களா?` :
      `You are ${utils.formatINR(diff)} short. Did you forget any cash purchases?`;
  }
};

export default reconciliation;
