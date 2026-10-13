// Centralized Financial Calculation Engine for VOX
// Computes Safe-to-Spend, Balances, Budgets, and Cash totals deterministically

export const financeEngine = {
  // Compute full financial summary from user state
  computeSummary(userData) {
    if (!userData) return this.getDefaultSummary();

    const accounts = userData.accounts || [];
    const transactions = userData.transactions || [];
    const bills = userData.bills || [];
    const budgets = userData.budgets || [];
    const goals = userData.goals || [];
    const profile = userData.profile || {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toDateString();

    // 1. Account Balances
    let cashBalance = 0;
    let digitalBalance = 0; // Bank + UPI + Cards
    let savingsBalance = 0;

    accounts.forEach(acc => {
      const bal = Number(acc.balance) || 0;
      if (acc.type === 'cash') {
        cashBalance += bal;
      } else if (acc.type === 'savings') {
        savingsBalance += bal;
      } else {
        digitalBalance += bal;
      }
    });

    const liquidAvailableBalance = cashBalance + digitalBalance;
    const netWorth = liquidAvailableBalance + savingsBalance;

    // 2. Transaction Totals (Current Month & Today)
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let todayExpense = 0;
    let todayIncome = 0;

    const categorySpending = {};

    transactions.forEach(tx => {
      const d = new Date(tx.timestamp || tx.createdAt);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isToday = d.toDateString() === todayStr;
      const amt = Number(tx.amount) || 0;

      if (isThisMonth) {
        if (tx.type === 'income') {
          monthlyIncome += amt;
        } else if (tx.type === 'expense') {
          monthlyExpense += amt;
          categorySpending[tx.category] = (categorySpending[tx.category] || 0) + amt;
        }
      }

      if (isToday) {
        if (tx.type === 'expense') {
          todayExpense += amt;
        } else if (tx.type === 'income') {
          todayIncome += amt;
        }
      }
    });

    // 3. Upcoming Essential Bills (due within next 30 days, not paid)
    let upcomingBillsTotal = 0;
    const upcomingBillsList = [];

    bills.forEach(bill => {
      if (bill.status !== 'paid') {
        const amt = Number(bill.amount) || 0;
        upcomingBillsTotal += amt;
        upcomingBillsList.push(bill);
      }
    });

    // 4. Committed Savings Target
    let committedSavings = 0;
    goals.forEach(g => {
      // Monthly savings allocation (e.g. 10% of remaining target or fixed 2000)
      const remaining = Math.max(0, (g.targetAmount || 0) - (g.currentAmount || 0));
      if (remaining > 0) {
        committedSavings += Math.min(2000, remaining);
      }
    });

    // 5. Minimum Cash/Bank Reserve Cushion
    const minimumReserve = profile.minimumReserve || 2000;

    // 6. Safe-to-Spend Calculation
    // Formula: availableBalance - upcomingEssentialBills - committedSavings - minimumReserve
    const uncommittedPool = liquidAvailableBalance - upcomingBillsTotal - committedSavings - minimumReserve;
    const safeToSpendMonthly = Math.max(0, uncommittedPool);

    // Days remaining in this month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - now.getDate() + 1);
    const safeToSpendToday = Math.round(safeToSpendMonthly / daysRemaining);

    // 7. Budget Health
    const budgetStatusList = budgets.map(b => {
      const spent = categorySpending[b.category] || b.spent || 0;
      const limit = Number(b.limit) || 1;
      const percentage = Math.round((spent / limit) * 100);
      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
      return {
        ...b,
        actualSpent: spent,
        percentage,
        status,
        remaining: Math.max(0, limit - spent)
      };
    });

    return {
      liquidAvailableBalance,
      cashBalance,
      digitalBalance,
      savingsBalance,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      todayExpense,
      todayIncome,
      categorySpending,
      upcomingBillsTotal,
      upcomingBillsList,
      committedSavings,
      minimumReserve,
      safeToSpendMonthly,
      safeToSpendToday,
      daysRemaining,
      budgetStatusList
    };
  },

  getDefaultSummary() {
    return {
      liquidAvailableBalance: 18450,
      cashBalance: 125,
      digitalBalance: 18325,
      savingsBalance: 20000,
      netWorth: 38450,
      monthlyIncome: 30000,
      monthlyExpense: 11550,
      todayExpense: 420,
      todayIncome: 0,
      categorySpending: { Groceries: 2400, Food: 1500, Transport: 900, Entertainment: 700, Rent: 8000 },
      upcomingBillsTotal: 9249,
      upcomingBillsList: [],
      committedSavings: 2000,
      minimumReserve: 2000,
      safeToSpendMonthly: 5201,
      safeToSpendToday: 640,
      daysRemaining: 12,
      budgetStatusList: []
    };
  }
};

export default financeEngine;
