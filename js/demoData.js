// Demo Data Generator for VOX Assistant
// Provides realistic Indian Rupee sample data adhering strictly to the specifications

export function getDemoData(userId = 'demo_user') {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate dates
  const fiveDaysLater = new Date(now);
  fiveDaysLater.setDate(now.getDate() + 5);

  const tenDaysLater = new Date(now);
  tenDaysLater.setDate(now.getDate() + 10);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  return {
    profile: {
      userId,
      name: "Saurabh",
      email: "demo@vox.ai",
      monthlyIncome: 30000,
      openingCash: 125,
      bankBalance: 18325,
      savings: 20000,
      rent: 8000,
      monthlyBudget: 15000,
      minimumReserve: 2000,
      currency: "INR",
      isDemo: true,
      onboardingCompleted: true,
      createdAt: now.toISOString()
    },

    accounts: [
      {
        id: "acc_cash",
        name: "Wallet Cash",
        type: "cash",
        balance: 125,
        updatedAt: now.toISOString()
      },
      {
        id: "acc_hdfc",
        name: "HDFC Primary Bank",
        type: "bank",
        balance: 15000,
        accountNumber: "•• 4821",
        updatedAt: now.toISOString()
      },
      {
        id: "acc_upi",
        name: "PhonePe / UPI",
        type: "upi",
        balance: 3325,
        linkedBank: "HDFC Bank",
        updatedAt: now.toISOString()
      },
      {
        id: "acc_savings",
        name: "Emergency Savings",
        type: "savings",
        balance: 20000,
        target: 50000,
        updatedAt: now.toISOString()
      }
    ],

    transactions: [
      {
        id: "tx_salary",
        userId,
        type: "income",
        amount: 30000,
        currency: "INR",
        category: "Salary",
        merchant: "Acme Corp Payroll",
        paymentMethod: "Bank Transfer",
        accountId: "acc_hdfc",
        description: "Monthly Software Internship Stipend",
        originalTranscript: "Got salary 30000",
        timestamp: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        source: "voice",
        confidence: 0.99,
        confirmed: true
      },
      {
        id: "tx_rent",
        userId,
        type: "expense",
        amount: 8000,
        currency: "INR",
        category: "Rent",
        merchant: "Apartment Landlord",
        paymentMethod: "UPI",
        accountId: "acc_upi",
        description: "Shared apartment rent payment",
        originalTranscript: "Paid rent 8000 via UPI",
        timestamp: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
        source: "voice",
        confidence: 0.98,
        confirmed: true
      },
      {
        id: "tx_groceries_1",
        userId,
        type: "expense",
        amount: 2400,
        currency: "INR",
        category: "Groceries",
        merchant: "Nature's Basket & Local Mart",
        paymentMethod: "PhonePe",
        accountId: "acc_upi",
        description: "Weekly groceries, vegetables and staples",
        originalTranscript: "Spent 2400 on groceries using PhonePe",
        timestamp: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
        source: "voice",
        confidence: 0.97,
        confirmed: true
      },
      {
        id: "tx_food_today",
        userId,
        type: "expense",
        amount: 420,
        currency: "INR",
        category: "Food",
        merchant: "Swiggy / Biryani House",
        paymentMethod: "UPI",
        accountId: "acc_upi",
        description: "Lunch & afternoon beverage",
        originalTranscript: "Spent 420 on food",
        timestamp: now.toISOString(),
        createdAt: now.toISOString(),
        source: "voice",
        confidence: 0.99,
        confirmed: true
      },
      {
        id: "tx_food_earlier",
        userId,
        type: "expense",
        amount: 1080,
        currency: "INR",
        category: "Food",
        merchant: "Campus Cafe & Quick Meals",
        paymentMethod: "UPI",
        accountId: "acc_upi",
        description: "Previous food expenses this month",
        originalTranscript: "Spent on food",
        timestamp: new Date(now.getTime() - 2 * 86400000).toISOString(),
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        source: "voice",
        confidence: 0.95,
        confirmed: true
      },
      {
        id: "tx_transport",
        userId,
        type: "expense",
        amount: 900,
        currency: "INR",
        category: "Transport",
        merchant: "Metro Card & Uber Auto",
        paymentMethod: "UPI",
        accountId: "acc_upi",
        description: "Metro monthly recharge and auto rides",
        originalTranscript: "Spent 900 on transport",
        timestamp: new Date(now.getTime() - 4 * 86400000).toISOString(),
        createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
        source: "voice",
        confidence: 0.98,
        confirmed: true
      },
      {
        id: "tx_entertainment",
        userId,
        type: "expense",
        amount: 700,
        currency: "INR",
        category: "Entertainment",
        merchant: "PVR Cinemas",
        paymentMethod: "Debit Card",
        accountId: "acc_hdfc",
        description: "Weekend movie ticket & snacks",
        originalTranscript: "Spent 700 on entertainment",
        timestamp: new Date(now.getTime() - 6 * 86400000).toISOString(),
        createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
        source: "voice",
        confidence: 0.96,
        confirmed: true
      },
      {
        id: "tx_headphones",
        userId,
        type: "expense",
        amount: 800,
        currency: "INR",
        category: "Electronics",
        merchant: "Amazon India",
        paymentMethod: "UPI",
        accountId: "acc_upi",
        description: "Boat BassHeads in-ear monitors",
        originalTranscript: "Spent 800 on headphones. Check back in one month.",
        timestamp: thirtyDaysAgo.toISOString(),
        createdAt: thirtyDaysAgo.toISOString(),
        source: "voice",
        confidence: 0.99,
        confirmed: true
      }
    ],

    bills: [
      {
        id: "bill_rent_next",
        name: "Rent (Next Month Advance)",
        amount: 8000,
        dueDate: fiveDaysLater.toISOString().split('T')[0],
        frequency: "Monthly",
        category: "Housing",
        status: "upcoming",
        essential: true,
        daysAway: 5
      },
      {
        id: "bill_internet",
        name: "Airtel Fiber Broadband",
        amount: 699,
        dueDate: tenDaysLater.toISOString().split('T')[0],
        frequency: "Monthly",
        category: "Utilities",
        status: "upcoming",
        essential: true,
        daysAway: 10
      },
      {
        id: "bill_electricity",
        name: "BESCOM Electricity",
        amount: 550,
        dueDate: new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0],
        frequency: "Monthly",
        category: "Utilities",
        status: "upcoming",
        essential: true,
        daysAway: 15
      }
    ],

    subscriptions: [
      {
        id: "sub_spotify",
        name: "Spotify Individual",
        amount: 119,
        billingCycle: "monthly",
        category: "Music",
        renewalDate: new Date(now.getTime() + 8 * 86400000).toISOString().split('T')[0]
      },
      {
        id: "sub_netflix",
        name: "Netflix Mobile Plan",
        amount: 199,
        billingCycle: "monthly",
        category: "Streaming",
        renewalDate: new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0]
      },
      {
        id: "sub_youtube",
        name: "YouTube Premium",
        amount: 129,
        billingCycle: "monthly",
        category: "Streaming",
        renewalDate: new Date(now.getTime() + 21 * 86400000).toISOString().split('T')[0]
      }
    ],

    budgets: [
      {
        id: "bgt_food",
        category: "Food",
        limit: 5000,
        spent: 1500, // 30%
        icon: "🍔"
      },
      {
        id: "bgt_groceries",
        category: "Groceries",
        limit: 4000,
        spent: 2400, // 60%
        icon: "🛒"
      },
      {
        id: "bgt_transport",
        category: "Transport",
        limit: 3000,
        spent: 900, // 30%
        icon: "🚇"
      },
      {
        id: "bgt_entertainment",
        category: "Entertainment",
        limit: 2000,
        spent: 1700, // 85% -> Trigger 80% warning
        icon: "🎬"
      }
    ],

    goals: [
      {
        id: "goal_emergency",
        name: "Emergency Fund",
        targetAmount: 50000,
        currentAmount: 20000,
        targetDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
        category: "Safety Net",
        icon: "🛡️"
      },
      {
        id: "goal_laptop",
        name: "Workstation Upgrade",
        targetAmount: 60000,
        currentAmount: 18000,
        targetDate: new Date(now.getFullYear() + 1, 3, 30).toISOString().split('T')[0],
        category: "Tech Gear",
        icon: "💻"
      }
    ],

    worthItItems: [
      {
        id: "wi_headphones",
        item: "Boat Headphones",
        amount: 800,
        category: "Electronics",
        purchaseDate: thirtyDaysAgo.toISOString().split('T')[0],
        reviewDate: todayStr,
        status: "pending", // Ready to be reviewed!
        rating: null,
        daysAgo: 30,
        notes: "Purchased for listening to lectures and music while commuting"
      },
      {
        id: "wi_jacket",
        item: "Rainy Windbreaker Jacket",
        amount: 1499,
        category: "Clothing",
        purchaseDate: new Date(now.getTime() - 65 * 86400000).toISOString().split('T')[0],
        reviewDate: new Date(now.getTime() - 35 * 86400000).toISOString().split('T')[0],
        status: "reviewed",
        rating: "very_happy",
        notes: "Protected laptop and books during sudden Bangalore monsoon rains"
      },
      {
        id: "wi_fastfood",
        item: "Midnight Food Delivery",
        amount: 450,
        category: "Food Delivery",
        purchaseDate: new Date(now.getTime() - 40 * 86400000).toISOString().split('T')[0],
        reviewDate: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0],
        status: "reviewed",
        rating: "not_worth_it",
        notes: "Food arrived cold and exceeded weekly dining budget"
      }
    ],

    cashReconciliation: {
      morningCash: 125,
      expectedCash: 125, // starting 125 with no recorded cash expenses yet
      lastCounted: 125,
      suggestedItems: [
        { label: "Water Bottle", amount: 10, icon: "💧" },
        { label: "Tea / Chai & Biscuits", amount: 15, icon: "☕" },
        { label: "Snacks", amount: 20, icon: "🥨" },
        { label: "Bus / Auto Coins", amount: 5, icon: "🚌" }
      ]
    },

    insights: [
      {
        id: "ins_1",
        title: "Budget Watch",
        message: "You've used 85% of your Entertainment budget for this month.",
        type: "warning",
        date: "Today"
      },
      {
        id: "ins_2",
        title: "Upcoming Essential",
        message: "Rent of ₹8,000 is due in 5 days. Reserved funds are safeguarded.",
        type: "info",
        date: "Today"
      },
      {
        id: "ins_3",
        title: "Subscriptions Summary",
        message: "Your 3 subscriptions total ₹447/month (approx. ₹5,364/year).",
        type: "tip",
        date: "Yesterday"
      }
    ]
  };
}

export default getDemoData;
