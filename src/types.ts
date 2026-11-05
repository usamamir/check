export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'loan'
  | 'mortgage'
  | 'real_estate'
  | 'other';

export type AccountGroup = 'cash' | 'credit' | 'investments' | 'property' | 'loans';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  group: AccountGroup;
  balance: number;
  lastSynced: string;
  mask: string;
  color: string;
  includeInNetWorth: boolean;
  holdings?: Holding[];
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  costBasis: number;
  changePct: number;
}

export interface Category {
  id: string;
  name: string;
  group: string;
  emoji: string;
  type: 'income' | 'expense' | 'transfer';
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  accountId: string;
  categoryId: string;
  notes: string;
  reviewed: boolean;
  pending: boolean;
  tags: string[];
  isRecurring?: boolean;
}

export interface BudgetCategory {
  categoryId: string;
  planned: number;
  rollover: boolean;
  section: 'income' | 'fixed' | 'flexible' | 'non_monthly' | 'goals';
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  type: 'save' | 'paydown';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  accountId?: string;
  monthlyContribution: number;
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'quarterly';
  nextDate: string;
  categoryId: string;
  accountId: string;
  type: 'income' | 'expense' | 'credit';
  active: boolean;
}

export interface NetWorthPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface AppUser {
  name: string;
  email: string;
  initials: string;
  partnerName?: string;
}

export interface FinanceState {
  user: AppUser;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: BudgetCategory[];
  goals: Goal[];
  recurring: RecurringItem[];
  netWorthHistory: NetWorthPoint[];
  budgetMode: 'flex' | 'category';
}
