import type { AppUser, BudgetCategory, Category, FinanceState } from '../types';

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return iso(d);
};

export const defaultCategories: Category[] = [
  { id: 'c-salary', name: 'Paychecks', group: 'Income', emoji: '💰', type: 'income' },
  { id: 'c-interest', name: 'Interest', group: 'Income', emoji: '📈', type: 'income' },
  { id: 'c-other-income', name: 'Other Income', group: 'Income', emoji: '✨', type: 'income' },
  { id: 'c-rent', name: 'Rent / Mortgage', group: 'Housing', emoji: '🏠', type: 'expense' },
  { id: 'c-utilities', name: 'Utilities', group: 'Housing', emoji: '💡', type: 'expense' },
  { id: 'c-internet', name: 'Internet', group: 'Housing', emoji: '📶', type: 'expense' },
  { id: 'c-groceries', name: 'Groceries', group: 'Food', emoji: '🛒', type: 'expense' },
  { id: 'c-restaurants', name: 'Restaurants', group: 'Food', emoji: '🍽️', type: 'expense' },
  { id: 'c-coffee', name: 'Coffee Shops', group: 'Food', emoji: '☕', type: 'expense' },
  { id: 'c-gas', name: 'Gas', group: 'Transport', emoji: '⛽', type: 'expense' },
  { id: 'c-transit', name: 'Public Transit', group: 'Transport', emoji: '🚇', type: 'expense' },
  { id: 'c-auto', name: 'Auto Payment', group: 'Transport', emoji: '🚗', type: 'expense' },
  { id: 'c-shopping', name: 'Shopping', group: 'Lifestyle', emoji: '🛍️', type: 'expense' },
  { id: 'c-entertainment', name: 'Entertainment', group: 'Lifestyle', emoji: '🎬', type: 'expense' },
  { id: 'c-streaming', name: 'Streaming', group: 'Lifestyle', emoji: '📺', type: 'expense' },
  { id: 'c-gym', name: 'Fitness', group: 'Lifestyle', emoji: '🏋️', type: 'expense' },
  { id: 'c-travel', name: 'Travel', group: 'Lifestyle', emoji: '✈️', type: 'expense' },
  { id: 'c-health', name: 'Medical', group: 'Health', emoji: '🩺', type: 'expense' },
  { id: 'c-insurance', name: 'Insurance', group: 'Health', emoji: '🛡️', type: 'expense' },
  { id: 'c-subscriptions', name: 'Software', group: 'Lifestyle', emoji: '💻', type: 'expense' },
  { id: 'c-personal', name: 'Personal Care', group: 'Lifestyle', emoji: '💅', type: 'expense' },
  { id: 'c-gifts', name: 'Gifts & Donations', group: 'Giving', emoji: '🎁', type: 'expense' },
  { id: 'c-transfer', name: 'Transfer', group: 'Transfers', emoji: '🔄', type: 'transfer' },
  { id: 'c-cc-payment', name: 'Credit Card Payment', group: 'Transfers', emoji: '💳', type: 'transfer' },
  { id: 'c-uncategorized', name: 'Uncategorized', group: 'Other', emoji: '❓', type: 'expense' },
];

/** Empty budget template — categories ready, amounts zeroed for your own plan */
export const blankBudgetTemplate: BudgetCategory[] = [
  { categoryId: 'c-salary', planned: 0, rollover: false, section: 'income' },
  { categoryId: 'c-interest', planned: 0, rollover: false, section: 'income' },
  { categoryId: 'c-rent', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-utilities', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-internet', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-auto', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-insurance', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-streaming', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-gym', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-subscriptions', planned: 0, rollover: false, section: 'fixed' },
  { categoryId: 'c-groceries', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-restaurants', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-coffee', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-gas', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-shopping', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-entertainment', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-personal', planned: 0, rollover: false, section: 'flexible' },
  { categoryId: 'c-travel', planned: 0, rollover: true, section: 'non_monthly' },
  { categoryId: 'c-gifts', planned: 0, rollover: true, section: 'non_monthly' },
  { categoryId: 'c-health', planned: 0, rollover: true, section: 'non_monthly' },
];

export function createBlankState(user?: Partial<AppUser>): FinanceState {
  const name = user?.name?.trim() || '';
  const initials =
    user?.initials ||
    (name
      ? name
          .split(/\s+/)
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?');
  return {
    user: {
      name,
      email: user?.email?.trim() || '',
      initials,
      partnerName: user?.partnerName ?? '',
    },
    budgetMode: 'flex',
    categories: structuredClone(defaultCategories),
    accounts: [],
    transactions: [],
    budgets: structuredClone(blankBudgetTemplate),
    goals: [],
    recurring: [],
    netWorthHistory: [],
  };
}

export const seedState: FinanceState = {
  user: {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    initials: 'AR',
    partnerName: 'Jordan',
  },
  budgetMode: 'flex',
  categories: structuredClone(defaultCategories),
  accounts: [
    {
      id: 'a-chase-checking',
      name: 'Everyday Checking',
      institution: 'Chase',
      type: 'checking',
      group: 'cash',
      balance: 8420.55,
      lastSynced: daysAgo(0),
      mask: '4821',
      color: '#117ACA',
      includeInNetWorth: true,
    },
    {
      id: 'a-ally-savings',
      name: 'High Yield Savings',
      institution: 'Ally',
      type: 'savings',
      group: 'cash',
      balance: 32450.12,
      lastSynced: daysAgo(0),
      mask: '9910',
      color: '#6B2D8B',
      includeInNetWorth: true,
    },
    {
      id: 'a-amex',
      name: 'Gold Card',
      institution: 'American Express',
      type: 'credit',
      group: 'credit',
      balance: -2145.67,
      lastSynced: daysAgo(0),
      mask: '1005',
      color: '#006FCF',
      includeInNetWorth: true,
    },
    {
      id: 'a-chase-sapphire',
      name: 'Sapphire Preferred',
      institution: 'Chase',
      type: 'credit',
      group: 'credit',
      balance: -892.4,
      lastSynced: daysAgo(1),
      mask: '7743',
      color: '#0C2340',
      includeInNetWorth: true,
    },
    {
      id: 'a-fidelity',
      name: 'Brokerage',
      institution: 'Fidelity',
      type: 'investment',
      group: 'investments',
      balance: 128430.88,
      lastSynced: daysAgo(0),
      mask: '3320',
      color: '#4A8C2A',
      includeInNetWorth: true,
      holdings: [
        { symbol: 'VTI', name: 'Vanguard Total Stock', shares: 245.2, price: 285.4, costBasis: 62000, changePct: 0.8 },
        { symbol: 'VXUS', name: 'Vanguard Total Intl', shares: 310.5, price: 68.2, costBasis: 18000, changePct: -0.3 },
        { symbol: 'BND', name: 'Vanguard Total Bond', shares: 180, price: 74.1, costBasis: 14000, changePct: 0.1 },
        { symbol: 'AAPL', name: 'Apple Inc.', shares: 42, price: 228.5, costBasis: 7200, changePct: 1.2 },
        { symbol: 'MSFT', name: 'Microsoft', shares: 18, price: 415.2, costBasis: 5800, changePct: 0.6 },
      ],
    },
    {
      id: 'a-401k',
      name: '401(k)',
      institution: 'Vanguard',
      type: 'investment',
      group: 'investments',
      balance: 95420.33,
      lastSynced: daysAgo(0),
      mask: '1188',
      color: '#C41230',
      includeInNetWorth: true,
      holdings: [
        { symbol: 'VTSAX', name: 'Total Stock Market', shares: 620.4, price: 132.8, costBasis: 70000, changePct: 0.7 },
        { symbol: 'VTIAX', name: 'Total Intl Stock', shares: 410.2, price: 34.5, costBasis: 12000, changePct: -0.2 },
      ],
    },
    {
      id: 'a-home',
      name: 'Primary Residence',
      institution: 'Manual',
      type: 'real_estate',
      group: 'property',
      balance: 685000,
      lastSynced: daysAgo(30),
      mask: '—',
      color: '#8B5E3C',
      includeInNetWorth: true,
    },
    {
      id: 'a-mortgage',
      name: 'Home Mortgage',
      institution: 'Rocket Mortgage',
      type: 'mortgage',
      group: 'loans',
      balance: -412800,
      lastSynced: daysAgo(2),
      mask: '5501',
      color: '#1A1A2E',
      includeInNetWorth: true,
    },
    {
      id: 'a-auto-loan',
      name: 'Auto Loan',
      institution: 'Toyota Financial',
      type: 'loan',
      group: 'loans',
      balance: -12450,
      lastSynced: daysAgo(3),
      mask: '2209',
      color: '#EB0A1E',
      includeInNetWorth: true,
    },
  ],
  budgets: [
    { categoryId: 'c-salary', planned: 9200, rollover: false, section: 'income' },
    { categoryId: 'c-interest', planned: 120, rollover: false, section: 'income' },
    { categoryId: 'c-rent', planned: 2800, rollover: false, section: 'fixed' },
    { categoryId: 'c-utilities', planned: 220, rollover: false, section: 'fixed' },
    { categoryId: 'c-internet', planned: 80, rollover: false, section: 'fixed' },
    { categoryId: 'c-auto', planned: 420, rollover: false, section: 'fixed' },
    { categoryId: 'c-insurance', planned: 185, rollover: false, section: 'fixed' },
    { categoryId: 'c-streaming', planned: 65, rollover: false, section: 'fixed' },
    { categoryId: 'c-gym', planned: 55, rollover: false, section: 'fixed' },
    { categoryId: 'c-subscriptions', planned: 48, rollover: false, section: 'fixed' },
    { categoryId: 'c-groceries', planned: 750, rollover: false, section: 'flexible' },
    { categoryId: 'c-restaurants', planned: 400, rollover: false, section: 'flexible' },
    { categoryId: 'c-coffee', planned: 80, rollover: false, section: 'flexible' },
    { categoryId: 'c-gas', planned: 180, rollover: false, section: 'flexible' },
    { categoryId: 'c-shopping', planned: 250, rollover: false, section: 'flexible' },
    { categoryId: 'c-entertainment', planned: 150, rollover: false, section: 'flexible' },
    { categoryId: 'c-personal', planned: 100, rollover: false, section: 'flexible' },
    { categoryId: 'c-travel', planned: 300, rollover: true, section: 'non_monthly' },
    { categoryId: 'c-gifts', planned: 100, rollover: true, section: 'non_monthly' },
    { categoryId: 'c-health', planned: 80, rollover: true, section: 'non_monthly' },
  ],
  goals: [
    {
      id: 'g-emergency',
      name: 'Emergency Fund',
      emoji: '🛟',
      type: 'save',
      targetAmount: 30000,
      currentAmount: 24500,
      targetDate: '2026-06-01',
      accountId: 'a-ally-savings',
      monthlyContribution: 500,
    },
    {
      id: 'g-vacation',
      name: 'Japan Trip',
      emoji: '🗾',
      type: 'save',
      targetAmount: 8000,
      currentAmount: 3200,
      targetDate: '2026-10-01',
      monthlyContribution: 400,
    },
    {
      id: 'g-auto',
      name: 'Pay off Auto Loan',
      emoji: '🚗',
      type: 'paydown',
      targetAmount: 12450,
      currentAmount: 3550,
      targetDate: '2027-03-01',
      accountId: 'a-auto-loan',
      monthlyContribution: 650,
    },
  ],
  recurring: [
    { id: 'r1', name: 'Payroll — Acme Corp', amount: 4600, frequency: 'monthly', nextDate: daysFromNow(8), categoryId: 'c-salary', accountId: 'a-chase-checking', type: 'income', active: true },
    { id: 'r2', name: 'Payroll — Acme Corp', amount: 4600, frequency: 'monthly', nextDate: daysFromNow(22), categoryId: 'c-salary', accountId: 'a-chase-checking', type: 'income', active: true },
    { id: 'r3', name: 'Mortgage', amount: 2800, frequency: 'monthly', nextDate: daysFromNow(1), categoryId: 'c-rent', accountId: 'a-chase-checking', type: 'expense', active: true },
    { id: 'r4', name: 'PG&E', amount: 142, frequency: 'monthly', nextDate: daysFromNow(12), categoryId: 'c-utilities', accountId: 'a-chase-checking', type: 'expense', active: true },
    { id: 'r5', name: 'Comcast Internet', amount: 79.99, frequency: 'monthly', nextDate: daysFromNow(5), categoryId: 'c-internet', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r6', name: 'Toyota Financial', amount: 418.22, frequency: 'monthly', nextDate: daysFromNow(9), categoryId: 'c-auto', accountId: 'a-chase-checking', type: 'expense', active: true },
    { id: 'r7', name: 'Netflix', amount: 22.99, frequency: 'monthly', nextDate: daysFromNow(3), categoryId: 'c-streaming', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r8', name: 'Spotify', amount: 16.99, frequency: 'monthly', nextDate: daysFromNow(14), categoryId: 'c-streaming', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r9', name: 'Disney+', amount: 13.99, frequency: 'monthly', nextDate: daysFromNow(18), categoryId: 'c-streaming', accountId: 'a-chase-sapphire', type: 'expense', active: true },
    { id: 'r10', name: 'Equinox', amount: 245, frequency: 'monthly', nextDate: daysFromNow(2), categoryId: 'c-gym', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r11', name: 'ChatGPT Plus', amount: 20, frequency: 'monthly', nextDate: daysFromNow(7), categoryId: 'c-subscriptions', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r12', name: 'iCloud+', amount: 9.99, frequency: 'monthly', nextDate: daysFromNow(11), categoryId: 'c-subscriptions', accountId: 'a-amex', type: 'expense', active: true },
    { id: 'r13', name: 'Geico Auto Insurance', amount: 148.5, frequency: 'monthly', nextDate: daysFromNow(16), categoryId: 'c-insurance', accountId: 'a-chase-checking', type: 'expense', active: true },
    { id: 'r14', name: 'Amex Gold Payment', amount: 1800, frequency: 'monthly', nextDate: daysFromNow(4), categoryId: 'c-cc-payment', accountId: 'a-chase-checking', type: 'credit', active: true },
  ],
  netWorthHistory: Array.from({ length: 12 }, (_, i) => {
    const base = 480000 + i * 8200 + Math.sin(i) * 3500;
    const assets = base + 420000;
    const liabilities = 430000 - i * 1800;
    return {
      date: monthsAgo(11 - i),
      assets,
      liabilities,
      netWorth: assets - liabilities,
    };
  }),
  transactions: [],
};

// Generate realistic transactions for the last ~60 days
const merchants: { name: string; categoryId: string; min: number; max: number; weight: number }[] = [
  { name: 'Whole Foods', categoryId: 'c-groceries', min: 35, max: 140, weight: 8 },
  { name: 'Trader Joe\'s', categoryId: 'c-groceries', min: 25, max: 95, weight: 7 },
  { name: 'Safeway', categoryId: 'c-groceries', min: 40, max: 120, weight: 4 },
  { name: 'Chipotle', categoryId: 'c-restaurants', min: 12, max: 28, weight: 6 },
  { name: 'Sweetgreen', categoryId: 'c-restaurants', min: 14, max: 22, weight: 4 },
  { name: 'The Italian Homemade Co.', categoryId: 'c-restaurants', min: 45, max: 110, weight: 2 },
  { name: 'Blue Bottle Coffee', categoryId: 'c-coffee', min: 5, max: 12, weight: 10 },
  { name: 'Starbucks', categoryId: 'c-coffee', min: 5, max: 9, weight: 5 },
  { name: 'Shell', categoryId: 'c-gas', min: 40, max: 75, weight: 4 },
  { name: 'Chevron', categoryId: 'c-gas', min: 45, max: 80, weight: 3 },
  { name: 'Amazon', categoryId: 'c-shopping', min: 15, max: 180, weight: 8 },
  { name: 'Target', categoryId: 'c-shopping', min: 20, max: 95, weight: 3 },
  { name: 'Apple Store', categoryId: 'c-shopping', min: 29, max: 299, weight: 1 },
  { name: 'AMC Theatres', categoryId: 'c-entertainment', min: 18, max: 45, weight: 2 },
  { name: 'Steam Games', categoryId: 'c-entertainment', min: 9.99, max: 59.99, weight: 1 },
  { name: 'Uber', categoryId: 'c-transit', min: 12, max: 38, weight: 4 },
  { name: 'BART', categoryId: 'c-transit', min: 3.5, max: 12, weight: 5 },
  { name: 'CVS Pharmacy', categoryId: 'c-health', min: 8, max: 55, weight: 2 },
  { name: 'Sephora', categoryId: 'c-personal', min: 22, max: 85, weight: 1 },
  { name: 'Netflix', categoryId: 'c-streaming', min: 22.99, max: 22.99, weight: 1 },
  { name: 'Spotify', categoryId: 'c-streaming', min: 16.99, max: 16.99, weight: 1 },
  { name: 'Equinox', categoryId: 'c-gym', min: 245, max: 245, weight: 1 },
  { name: 'PG&E', categoryId: 'c-utilities', min: 120, max: 180, weight: 1 },
  { name: 'Comcast', categoryId: 'c-internet', min: 79.99, max: 79.99, weight: 1 },
  { name: 'Toyota Financial', categoryId: 'c-auto', min: 418.22, max: 418.22, weight: 1 },
  { name: 'Mortgage Payment', categoryId: 'c-rent', min: 2800, max: 2800, weight: 1 },
  { name: 'Direct Deposit Acme', categoryId: 'c-salary', min: 4600, max: 4600, weight: 2 },
  { name: 'Ally Interest', categoryId: 'c-interest', min: 95, max: 130, weight: 1 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildTransactions() {
  const rand = seededRandom(42);
  const txs: FinanceState['transactions'] = [];
  let id = 1;

  const pickMerchant = () => {
    const total = merchants.reduce((s, m) => s + m.weight, 0);
    let r = rand() * total;
    for (const m of merchants) {
      r -= m.weight;
      if (r <= 0) return m;
    }
    return merchants[0];
  };

  for (let day = 0; day < 55; day++) {
    const count = day % 7 === 0 || day % 7 === 6 ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const m = pickMerchant();
      const amountRaw = m.min + rand() * (m.max - m.min);
      const isIncome = m.categoryId === 'c-salary' || m.categoryId === 'c-interest';
      const amount = isIncome ? Math.round(amountRaw * 100) / 100 : -Math.round(amountRaw * 100) / 100;
      const accountId = isIncome
        ? m.categoryId === 'c-interest'
          ? 'a-ally-savings'
          : 'a-chase-checking'
        : rand() > 0.55
          ? 'a-amex'
          : rand() > 0.5
            ? 'a-chase-sapphire'
            : 'a-chase-checking';

      txs.push({
        id: `t-${id++}`,
        date: daysAgo(day),
        merchant: m.name,
        amount,
        accountId,
        categoryId: m.categoryId,
        notes: '',
        reviewed: day > 7 || rand() > 0.35,
        pending: day === 0 && rand() > 0.7,
        tags: [],
        isRecurring: ['Netflix', 'Spotify', 'Equinox', 'PG&E', 'Comcast', 'Toyota Financial', 'Mortgage Payment', 'Direct Deposit Acme'].includes(m.name),
      });
    }
  }

  // A few unreviewed / uncategorized for the demo workflow
  txs.unshift(
    {
      id: `t-${id++}`,
      date: daysAgo(0),
      merchant: 'Unknown Merchant 4821',
      amount: -47.82,
      accountId: 'a-amex',
      categoryId: 'c-uncategorized',
      notes: '',
      reviewed: false,
      pending: true,
      tags: [],
    },
    {
      id: `t-${id++}`,
      date: daysAgo(1),
      merchant: 'REI Co-op',
      amount: -128.4,
      accountId: 'a-chase-sapphire',
      categoryId: 'c-shopping',
      notes: '',
      reviewed: false,
      pending: false,
      tags: ['outdoors'],
    },
  );

  return txs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

seedState.transactions = buildTransactions();

export function calcNetWorth(accounts: FinanceState['accounts']) {
  return accounts.filter((a) => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0);
}

export function calcAssets(accounts: FinanceState['accounts']) {
  return accounts.filter((a) => a.includeInNetWorth && a.balance > 0).reduce((s, a) => s + a.balance, 0);
}

export function calcLiabilities(accounts: FinanceState['accounts']) {
  return accounts.filter((a) => a.includeInNetWorth && a.balance < 0).reduce((s, a) => s + a.balance, 0);
}
