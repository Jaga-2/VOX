// VOX Innovation 4: True "Worth-It" Purchase Memory & Reflection Engine
// Links purchase memories to original transaction IDs and builds personal spending wisdom

import { utils } from './utils.js';

export const worthit = {
  // Create a linked Worth-It purchase memory record
  createMemoryRecord(transaction, reviewDays = 30) {
    const purchaseDate = transaction.timestamp || new Date().toISOString();
    const pDate = new Date(purchaseDate);
    const rDate = new Date(pDate);
    rDate.setDate(rDate.getDate() + reviewDays);

    return {
      id: 'wi_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      originalTransactionId: transaction.id || null,
      userId: transaction.userId || null,
      item: transaction.category === 'Electronics' ? 'Headphones' : (transaction.merchant || transaction.category || 'Item'),
      amount: Number(transaction.amount) || 0,
      category: transaction.category || 'Shopping',
      purchaseDate: pDate.toISOString().split('T')[0],
      reviewDate: rDate.toISOString().split('T')[0],
      status: 'pending', // 'pending' | 'reviewed'
      rating: null,      // 'very_happy' | 'happy' | 'neutral' | 'not_worth_it'
      notes: '',
      createdAt: new Date().toISOString()
    };
  },

  // Get pending items due for review
  getPendingReviews(worthItItems = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return worthItItems.filter(item => {
      if (item.status === 'reviewed') return false;
      const reviewDate = new Date(item.reviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate <= today || item.daysAgo >= 30;
    });
  },

  // Get all reviewed items for Purchase History
  getReviewedHistory(worthItItems = []) {
    return worthItItems.filter(item => item.status === 'reviewed');
  },

  // Calculate spending satisfaction metrics
  computeSatisfactionStats(worthItItems = []) {
    const reviewed = worthItItems.filter(i => i.status === 'reviewed');
    if (reviewed.length === 0) {
      return {
        totalReviewed: 0,
        satisfactionRate: 100,
        regretRate: 0,
        totalReviewedSpend: 0,
        satisfactionScore: "N/A"
      };
    }

    let happyCount = 0;
    let regretCount = 0;
    let totalSpend = 0;
    let regretSpend = 0;

    reviewed.forEach(i => {
      const amt = Number(i.amount) || 0;
      totalSpend += amt;
      if (i.rating === 'very_happy' || i.rating === 'happy') {
        happyCount++;
      } else if (i.rating === 'not_worth_it') {
        regretCount++;
        regretSpend += amt;
      }
    });

    const satisfactionRate = Math.round((happyCount / reviewed.length) * 100);
    const regretRate = Math.round((regretCount / reviewed.length) * 100);

    return {
      totalReviewed: reviewed.length,
      happyCount,
      regretCount,
      satisfactionRate,
      regretRate,
      totalSpend,
      regretSpend
    };
  },

  // Generate conversational review question (Bilingual)
  getReviewPrompt(item, lang = 'en-IN') {
    const isTamil = lang === 'ta-IN';
    const title = isTamil ? "பயனுள்ளதா? மறுஆய்வு" : "Worth-It Reflection";
    const question = isTamil ?
      `நீங்கள் ஒரு மாதத்திற்கு முன்பு ${item.item} பொருளை ${utils.formatINR(item.amount)} ரூபாய்க்கு வாங்கினீர்கள். இந்த வாங்குதலில் நீங்கள் மகிழ்ச்சியடைகிறீர்களா?` :
      `You bought ${item.item} for ${utils.formatINR(item.amount)} one month ago. Are you happy with this purchase?`;

    return {
      title,
      question,
      item
    };
  }
};

export default worthit;
