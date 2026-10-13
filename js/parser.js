// Deterministic Voice & Text Financial Parser for VOX
// Enhanced with bilingual English, Tamil (தமிழ்), and Tanglish NLP engine

import { languageParser } from './languageParser.js';

export const parser = {
  // Main parse method
  parse(rawTranscript) {
    if (!rawTranscript || typeof rawTranscript !== 'string') {
      return {
        success: false,
        error: "Empty voice input. Please speak your expense or question.",
        requiresConfirmation: false
      };
    }

    const text = rawTranscript.trim();
    const lower = text.toLowerCase();

    // 1. Check Affordability Query: English, Tamil, Tanglish
    // e.g. "Can I afford...", "1200 ரூபாய் ஜாக்கெட் வாங்க முடியுமா?", "1200 rupees jacket vaanga mudiyuma?"
    if (languageParser.isAffordabilityIntent(text)) {
      const details = languageParser.extractAffordabilityDetails(text);
      return {
        type: 'affordability',
        item: details.item,
        amount: details.amount,
        originalTranscript: text,
        confidence: details.amount ? 0.98 : 0.6,
        requiresConfirmation: !details.amount,
        missingFieldPrompt: !details.amount ? "What is the cost of the item?" : null
      };
    }

    // 2. Check Cash Reconciliation: "I have 100 cash in hand", "என்னிடம் 100 ரூபாய் பணம் இருக்கிறது", "Enkitta 100 rs cash irukku"
    if (languageParser.isCashReconIntent(text)) {
      const amt = languageParser.extractAmount(text);
      return {
        type: 'reconciliation',
        countedCash: amt,
        originalTranscript: text,
        confidence: 0.96,
        requiresConfirmation: false
      };
    }

    // 3. Check Multi-item missing cash reconciliation response (e.g. "₹10 water and ₹15 snacks" or "10 ரூபாய் தண்ணீர் மற்றும் 15 ரூபாய் தின்பண்டங்கள்")
    const multiItems = languageParser.extractMultipleItems(text);
    if (multiItems.length > 1) {
      const totalAmount = multiItems.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        type: 'reconciliation_items',
        items: multiItems,
        totalAmount,
        originalTranscript: text,
        confidence: 0.95,
        requiresConfirmation: true
      };
    }

    // 4. Check Worth-It follow-up request (Pure reminder or purchase with follow-up)
    const hasPurchaseVerb = lower.includes('spent') || lower.includes('paid') || lower.includes('bought') ||
                            text.includes('வாங்கினேன்') || lower.includes('vanginen') || lower.includes('vaanginen');

    if (languageParser.isWorthItReminderIntent(text) && !hasPurchaseVerb) {
      const amount = languageParser.extractAmount(text);
      let item = text
        .replace(/(?:check|on|remind\s+me|கழித்து|என்னிடம்|கேள்|check\s+pannunga|kalichu)/gi, '')
        .replace(/[\d,]+(?:\.\d+)?\s*(?:rupees|rs|ரூபாய்)?/gi, '')
        .trim();
      if (!item) item = 'Item';

      return {
        type: 'worthit',
        item: item.charAt(0).toUpperCase() + item.slice(1),
        amount: amount || 0,
        reviewDays: 30,
        originalTranscript: text,
        confidence: 0.92,
        requiresConfirmation: false
      };
    }

    // 5. Conversational Financial Queries (English, Tamil, Tanglish)
    if (this.isQueryIntent(text)) {
      return this.parseQueryIntent(lower, text);
    }

    // 6. Income Intents: "Got salary 30000", "சம்பளம் 30000 வந்தது", "Received 2000"
    if (lower.includes('salary') || lower.includes('received') || lower.includes('credited') ||
        text.includes('சம்பளம்') || text.includes('வருமானம்') || lower.includes('sambalam')) {
      const amount = languageParser.extractAmount(text);
      const category = 'Salary';
      const paymentMethod = languageParser.extractPaymentMethod(text) || 'Bank Transfer';

      return {
        type: 'income',
        amount: amount || 0,
        category,
        paymentMethod,
        description: text,
        originalTranscript: text,
        confidence: amount ? 0.96 : 0.65,
        requiresConfirmation: !amount || amount > 100000,
        missingFieldPrompt: !amount ? "How much did you receive?" : null
      };
    }

    // 7. Expense Intents: English, Tamil, Tanglish
    // e.g. "Spent 450 on groceries", "நான் மளிகைக்கு 450 ரூபாய் செலவு செய்தேன்.", "Innaiku groceries-ku 450 rupees spend panninen."
    const amount = languageParser.extractAmount(text);
    const category = languageParser.extractCategory(text);
    const paymentMethod = languageParser.extractPaymentMethod(text) || (lower.includes('cash') || text.includes('ரொக்கம்') ? 'Cash' : 'UPI');
    const merchant = this.extractMerchant(text) || (category !== 'Other' ? category : 'General Expense');
    const hasWorthIt = languageParser.isWorthItReminderIntent(text);

    return {
      type: 'expense',
      amount: amount || 0,
      currency: 'INR',
      category: category || 'Other',
      merchant,
      paymentMethod,
      description: text,
      hasWorthIt,
      worthItDays: hasWorthIt ? 30 : 0,
      originalTranscript: text,
      confidence: (amount && category !== 'Other') ? 0.96 : (amount ? 0.8 : 0.5),
      requiresConfirmation: !amount || !category || category === 'Other' || amount > 25000,
      missingFieldPrompt: !amount ? "How much did you spend?" : (!category || category === 'Other' ? "Which category was that for (e.g. Food, Groceries, Travel)?" : null)
    };
  },

  // Helper: Detect whether text is a query
  isQueryIntent(text) {
    const t = text.toLowerCase();
    return (
      t.match(/^(?:what|how\s+much|show|where|can\s+i|tell\s+me)\b/i) ||
      t.endsWith('?') ||
      text.includes('எவ்வளவு') ||
      text.includes('காட்டு') ||
      text.includes('என்ன') ||
      t.includes('evlo') ||
      t.includes('enna')
    );
  },

  // Helper: Extract Merchant
  extractMerchant(text) {
    const t = text.toLowerCase();
    const commonMerchants = ['swiggy', 'zomato', 'blinkit', 'zepto', 'amazon', 'flipkart', 'myntra', 'uber', 'ola', 'pvr', 'dmart', 'airtel', 'jio'];
    for (const m of commonMerchants) {
      if (t.includes(m)) {
        return m.charAt(0).toUpperCase() + m.slice(1);
      }
    }
    return null;
  },

  // Parse Conversational Query Intent
  parseQueryIntent(lowerText, rawText) {
    // Today's spending query
    if (lowerText.includes('spend today') || lowerText.includes('spent today') || rawText.includes('இன்று நான் எவ்வளவு') || lowerText.includes('innaiku')) {
      return { type: 'query', subType: 'spend_today', originalTranscript: rawText, confidence: 0.99 };
    }
    // Balance query
    if (lowerText.includes('balance') || lowerText.includes('how much do i have') || rawText.includes('இருப்பு') || lowerText.includes('irukku')) {
      return { type: 'query', subType: 'balance', originalTranscript: rawText, confidence: 0.99 };
    }
    // Safe-to-spend query
    if (lowerText.includes('can i spend this week') || lowerText.includes('safe to spend') || rawText.includes('பாதுகாப்பான')) {
      return { type: 'query', subType: 'safe_to_spend', originalTranscript: rawText, confidence: 0.98 };
    }
    // Category spend
    if (lowerText.includes('food') || rawText.includes('உணவு')) {
      return { type: 'query', subType: 'category_spend', category: 'Food', originalTranscript: rawText, confidence: 0.95 };
    }
    // Upcoming bills
    if (lowerText.includes('bill') || lowerText.includes('upcoming') || rawText.includes('கட்டணம்') || rawText.includes('வாடகை')) {
      return { type: 'query', subType: 'upcoming_bills', originalTranscript: rawText, confidence: 0.98 };
    }
    // Subscriptions
    if (lowerText.includes('subscription') || rawText.includes('சந்தா')) {
      return { type: 'query', subType: 'subscriptions', originalTranscript: rawText, confidence: 0.98 };
    }
    // Cash balance
    if (lowerText.includes('cash') || rawText.includes('ரொக்கம்')) {
      return { type: 'query', subType: 'cash_balance', originalTranscript: rawText, confidence: 0.95 };
    }

    return {
      type: 'query',
      subType: 'general_help',
      originalTranscript: rawText,
      confidence: 0.8
    };
  }
};

export default parser;
