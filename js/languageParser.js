// Bilingual Language Parser for VOX
// Supports English, Tamil (தமிழ்) and Tanglish (Tamil written in Latin script)

export const languageParser = {
  // Tamil Number word mapping
  tamilNumbers: {
    'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
    'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
    'பதினைந்து': 15, 'இருபது': 20, 'இருபத்தைந்து': 25, 'முப்பது': 30,
    'நாற்பது': 40, 'ஐம்பது': 50, 'நூறு': 100, 'இருநூறு': 200,
    'முந்நூறு': 300, 'நாநூறு': 400, 'ஐந்நூறு': 500, 'எண்ணூறு': 800,
    'ஆயிரம்': 1000, 'ஆயிரத்து இருநூறு': 1200, 'இரண்டாயிரம்': 2000,
    'ஐந்தாயிரம்': 5000, 'பத்தாயிரம்': 10000, 'முப்பதாயிரம்': 30000
  },

  // Extract amount supporting digits, currency symbols, and Tamil number tokens
  extractAmount(text) {
    if (!text) return 0;

    // Check standard digits: 450, 1,200, ₹450, 450 ரூபாய், 450 rs, 450 rupees
    const digitMatch = text.match(/(?:₹|rs\.?|inr|ரூபாய்)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:rupees|rs|bucks|inr|ரூபாய்|ரூ)?/i);
    if (digitMatch) {
      const tokens = text.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g);
      if (tokens && tokens.length > 0) {
        const clean = tokens[0].replace(/,/g, '');
        const val = parseFloat(clean);
        if (!isNaN(val)) return val;
      }
    }

    // Check Tamil written numbers
    for (const [word, num] of Object.entries(this.tamilNumbers)) {
      if (text.includes(word)) {
        return num;
      }
    }

    return 0;
  },

  // Extract multiple items (e.g. "₹10 water and ₹15 snacks" or "10 ரூபாய் தண்ணீர் மற்றும் 15 ரூபாய் தின்பண்டங்கள்")
  extractMultipleItems(text) {
    const items = [];
    if (!text) return items;

    // Split on "and", "மற்றும்", "&", ","
    const parts = text.split(/(?:and|மற்றும்|கூட|&|,)/i);
    parts.forEach(part => {
      const amt = this.extractAmount(part);
      if (amt > 0) {
        let label = part
          .replace(/(?:₹|rs\.?|inr|ரூபாய்|ரூ)?\s*[\d,]+(?:\.\d+)?\s*(?:rupees|rs|ரூபாய்)?/gi, '')
          .replace(/\b(?:for|on|bought|vaanginen|vanginen|செலவு|செய்தேன்|ரூபாய்க்கு)\b/gi, '')
          .trim();
        if (!label) label = "Cash item";
        const cat = this.extractCategory(part);
        items.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          amount: amt,
          category: cat
        });
      }
    });

    return items;
  },

  // Category Extraction
  extractCategory(text) {
    const t = text.toLowerCase();

    // Groceries (மளிகை)
    if (t.match(/\b(?:grocer(?:y|ies)|மளிகை|மளிகைக்கு|காய்கறி|பல்பொருள்|kirana|supermarket|vegetables)\b/i) || t.includes('groceries-ku')) {
      return 'Groceries';
    }

    // Food (உணவு / சாப்பாடு)
    if (t.match(/\b(?:food|dining|உணவு|சாப்பாடு|ஹோட்டல்|தின்பண்டங்கள்|தண்ணீர்|டீ|காபி|snacks|water|swiggy|zomato|burger|biryani|chai)\b/i) || t.includes('saapadu') || t.includes('tiffin')) {
      return 'Food';
    }

    // Rent (வாடகை)
    if (t.match(/\b(?:rent|வாடகை|வீட்டு வாடகை|vaadagai|flat)\b/i)) {
      return 'Rent';
    }

    // Transport (போக்குவரத்து)
    if (t.match(/\b(?:transport|போக்குவரத்து|பயணம்|ஆட்டோ|பஸ்|பெட்ரோல்|metro|auto|bus|petrol|fuel|uber|ola)\b/i)) {
      return 'Transport';
    }

    // Electronics & Gadgets (எலக்ட்ரானிக்ஸ் / ஹெட்போன்)
    if (t.match(/\b(?:headphone(?:s)?|ஹெட்போன்|மடிக்கணினி|மொபைல்|laptop|earphones|gadget|boat)\b/i)) {
      return 'Electronics';
    }

    // Shopping & Clothing (ஆடை / ஜாக்கெட்)
    if (t.match(/\b(?:shopping|jacket|ஜாக்கெட்|ஆடை|துணி|சட்டை|shoes|clothes|myntra|amazon)\b/i)) {
      return 'Shopping';
    }

    // Entertainment (திரைப்படம் / சினிமா)
    if (t.match(/\b(?:movie|cinema|திரைப்படம்|சினிமா|பொழுதுபோக்கு|theatre|pvr)\b/i)) {
      return 'Entertainment';
    }

    // Utilities (மின்சாரம் / இணையம்)
    if (t.match(/\b(?:electricity|மின்சாரம்|வைஃபை|இணையம்|broadband|wifi|phone|recharge|bill)\b/i)) {
      return 'Utilities';
    }

    // Salary / Income (சம்பளம் / வருமானம்)
    if (t.match(/\b(?:salary|சம்பளம்|வருமானம்|stipend|sambalam)\b/i)) {
      return 'Salary';
    }

    return 'Other';
  },

  // Payment Method
  extractPaymentMethod(text) {
    const t = text.toLowerCase();
    if (t.includes('cash') || t.includes('ரொக்கம்') || t.includes('பணம்') || t.includes('கைப்பணம்') || t.includes('kaipanam')) {
      return 'Cash';
    }
    if (t.includes('phonepe') || t.includes('போன்பே')) return 'PhonePe';
    if (t.includes('gpay') || t.includes('கூகுள் பே')) return 'Google Pay';
    if (t.includes('paytm') || t.includes('பேடிஎம்')) return 'Paytm';
    if (t.includes('upi') || t.includes('யுபிஐ')) return 'UPI';
    if (t.includes('card') || t.includes('அட்டை') || t.includes('debit') || t.includes('credit')) return 'Card';
    if (t.includes('bank') || t.includes('வங்கி')) return 'Bank Transfer';
    return null;
  },

  // Affordability intent detection
  isAffordabilityIntent(text) {
    const t = text.toLowerCase();
    return (
      t.includes('can i afford') ||
      t.includes('could i buy') ||
      t.includes('வாங்க முடியுமா') ||
      t.includes('வாங்கலாமா') ||
      t.includes('vaanga mudiyuma') ||
      t.includes('vanga mudiyuma')
    );
  },

  // Extract Affordability Details
  extractAffordabilityDetails(text) {
    const amount = this.extractAmount(text);
    let item = text
      .replace(/(?:can\s+i\s+afford|could\s+i\s+buy|வாங்க\s+முடியுமா|வாங்கலாமா|vaanga\s+mudiyuma|vanga\s+mudiyuma)/gi, '')
      .replace(/(?:for|at|costing|worth)\s*(?:₹|rs\.?|inr|ரூபாய்)?\s*[\d,]+(?:\.\d+)?/gi, '')
      .replace(/[\d,]+(?:\.\d+)?\s*(?:ரூபாய்|rupees|rs)?/gi, '')
      .replace(/\b(?:this\s+month|today|now|இம்மாதம்|இன்று)\b/gi, '')
      .replace(/\b(?:a|an|the|ஒரு)\b/gi, '')
      .trim();

    if (!item) {
      if (text.toLowerCase().includes('jacket') || text.includes('ஜாக்கெட்')) item = "Jacket";
      else item = "Item";
    }

    return {
      amount,
      item: item.charAt(0).toUpperCase() + item.slice(1)
    };
  },

  // Cash Reconciliation Intent Detection
  isCashReconIntent(text) {
    const t = text.toLowerCase();
    return (
      (t.includes('cash') && (t.includes('have') || t.includes('wallet') || t.includes('hand'))) ||
      t.includes('பணம் இருக்கிறது') ||
      t.includes('ரொக்கம் இருக்கிறது') ||
      t.includes('கையில்') ||
      t.includes('பணப்பையில்') ||
      t.includes('enkitta') ||
      t.includes('kaiyil')
    );
  },

  // Worth-It follow-up intent detection
  isWorthItReminderIntent(text) {
    const t = text.toLowerCase();
    return (
      t.includes('check back') ||
      t.includes('remind me to check') ||
      t.includes('கழித்து என்னிடம் கேள்') ||
      t.includes('மறுஆய்வு செய்') ||
      t.includes('check pannunga') ||
      t.includes('kalichu check') ||
      t.includes('worth it')
    );
  }
};

export default languageParser;
