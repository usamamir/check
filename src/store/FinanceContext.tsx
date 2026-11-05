import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createBlankState, seedState } from '../data/seed';
import type {
  Account,
  AppUser,
  BudgetCategory,
  FinanceState,
  Goal,
  RecurringItem,
  Transaction,
} from '../types';

const STORAGE_KEY = 'monarch-clone-state-v2';
const AUTH_KEY = 'monarch-clone-authed';
const LEGACY_STORAGE_KEY = 'monarch-clone-state-v1';

interface FinanceContextValue {
  state: FinanceState;
  authed: boolean;
  isBlank: boolean;
  login: () => void;
  logout: () => void;
  /** Wipe everything and start empty so you can enter your own data */
  startFresh: (user?: Partial<AppUser>) => void;
  /** Restore the built-in sample household */
  loadSampleData: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  markReviewed: (ids: string[], reviewed?: boolean) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  deleteAllTransactions: () => void;
  updateBudget: (categoryId: string, planned: number) => void;
  setBudgetMode: (mode: 'flex' | 'category') => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  addAccount: (account: Omit<Account, 'id' | 'lastSynced'>) => void;
  deleteAccount: (id: string) => void;
  toggleRecurring: (id: string) => void;
  updateRecurring: (id: string, patch: Partial<RecurringItem>) => void;
  deleteRecurring: (id: string) => void;
  addRecurring: (item: Omit<RecurringItem, 'id'>) => void;
  getCategory: (id: string) => FinanceState['categories'][number] | undefined;
  getAccount: (id: string) => Account | undefined;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function isValidState(value: unknown): value is FinanceState {
  if (!value || typeof value !== 'object') return false;
  const s = value as FinanceState;
  return (
    Array.isArray(s.accounts) &&
    Array.isArray(s.transactions) &&
    Array.isArray(s.categories) &&
    Array.isArray(s.budgets) &&
    Array.isArray(s.goals) &&
    Array.isArray(s.recurring) &&
    Array.isArray(s.netWorthHistory) &&
    !!s.user &&
    typeof s.user === 'object'
  );
}

function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      // Accept empty arrays — previously we required sample data and could never clear it
      if (isValidState(parsed)) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return structuredClone(seedState);
}

function persist(state: FinanceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(() => loadState());
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === '1');

  useEffect(() => {
    persist(state);
  }, [state]);

  const isBlank =
    state.accounts.length === 0 &&
    state.transactions.length === 0 &&
    state.goals.length === 0 &&
    state.recurring.length === 0;

  const login = useCallback(() => {
    localStorage.setItem(AUTH_KEY, '1');
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }, []);

  const startFresh = useCallback((user?: Partial<AppUser>) => {
    const blank = createBlankState(user ?? { name: '', email: '', initials: '?' });
    setState(blank);
    persist(blank);
  }, []);

  const loadSampleData = useCallback(() => {
    const fresh = structuredClone(seedState);
    setState(fresh);
    persist(fresh);
  }, []);

  const updateUser = useCallback((patch: Partial<AppUser>) => {
    setState((s) => {
      const nextUser = { ...s.user, ...patch };
      if (patch.name !== undefined && !patch.initials) {
        const parts = nextUser.name.trim().split(/\s+/).filter(Boolean);
        nextUser.initials = parts.length
          ? parts
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
          : '?';
      }
      return { ...s, user: nextUser };
    });
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const markReviewed = useCallback((ids: string[], reviewed = true) => {
    const set = new Set(ids);
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (set.has(t.id) ? { ...t, reviewed } : t)),
    }));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const id = `t-${Date.now()}`;
    setState((s) => ({
      ...s,
      transactions: [{ ...tx, id }, ...s.transactions],
      accounts: s.accounts.map((a) =>
        a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => {
      const tx = s.transactions.find((t) => t.id === id);
      if (!tx) return s;
      return {
        ...s,
        transactions: s.transactions.filter((t) => t.id !== id),
        accounts: s.accounts.map((a) =>
          a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a,
        ),
      };
    });
  }, []);

  const deleteAllTransactions = useCallback(() => {
    setState((s) => ({ ...s, transactions: [] }));
  }, []);

  const updateBudget = useCallback((categoryId: string, planned: number) => {
    setState((s) => ({
      ...s,
      budgets: s.budgets.map((b) => (b.categoryId === categoryId ? { ...b, planned } : b)),
    }));
  }, []);

  const setBudgetMode = useCallback((mode: 'flex' | 'category') => {
    setState((s) => ({ ...s, budgetMode: mode }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    setState((s) => ({
      ...s,
      goals: [...s.goals, { ...goal, id: `g-${Date.now()}` }],
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  const updateAccount = useCallback((id: string, patch: Partial<Account>) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'lastSynced'>) => {
    setState((s) => ({
      ...s,
      accounts: [
        ...s.accounts,
        {
          ...account,
          id: `a-${Date.now()}`,
          lastSynced: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.filter((a) => a.id !== id),
      transactions: s.transactions.filter((t) => t.accountId !== id),
      recurring: s.recurring.filter((r) => r.accountId !== id),
      goals: s.goals.map((g) => (g.accountId === id ? { ...g, accountId: undefined } : g)),
    }));
  }, []);

  const toggleRecurring = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    }));
  }, []);

  const updateRecurring = useCallback((id: string, patch: Partial<RecurringItem>) => {
    setState((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== id) }));
  }, []);

  const addRecurring = useCallback((item: Omit<RecurringItem, 'id'>) => {
    setState((s) => ({
      ...s,
      recurring: [...s.recurring, { ...item, id: `r-${Date.now()}` }],
    }));
  }, []);

  const getCategory = useCallback(
    (id: string) => state.categories.find((c) => c.id === id),
    [state.categories],
  );

  const getAccount = useCallback(
    (id: string) => state.accounts.find((a) => a.id === id),
    [state.accounts],
  );

  const value = useMemo(
    () => ({
      state,
      authed,
      isBlank,
      login,
      logout,
      startFresh,
      loadSampleData,
      updateUser,
      updateTransaction,
      markReviewed,
      addTransaction,
      deleteTransaction,
      deleteAllTransactions,
      updateBudget,
      setBudgetMode,
      updateGoal,
      addGoal,
      deleteGoal,
      updateAccount,
      addAccount,
      deleteAccount,
      toggleRecurring,
      updateRecurring,
      deleteRecurring,
      addRecurring,
      getCategory,
      getAccount,
    }),
    [
      state,
      authed,
      isBlank,
      login,
      logout,
      startFresh,
      loadSampleData,
      updateUser,
      updateTransaction,
      markReviewed,
      addTransaction,
      deleteTransaction,
      deleteAllTransactions,
      updateBudget,
      setBudgetMode,
      updateGoal,
      addGoal,
      deleteGoal,
      updateAccount,
      addAccount,
      deleteAccount,
      toggleRecurring,
      updateRecurring,
      deleteRecurring,
      addRecurring,
      getCategory,
      getAccount,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function spentForCategory(
  transactions: Transaction[],
  categoryId: string,
  monthPrefix?: string,
) {
  const prefix = monthPrefix ?? new Date().toISOString().slice(0, 7);
  return transactions
    .filter((t) => t.categoryId === categoryId && t.date.startsWith(prefix) && !t.pending)
    .reduce((s, t) => s + Math.abs(Math.min(t.amount, 0)), 0);
}

export function incomeForCategory(
  transactions: Transaction[],
  categoryId: string,
  monthPrefix?: string,
) {
  const prefix = monthPrefix ?? new Date().toISOString().slice(0, 7);
  return transactions
    .filter((t) => t.categoryId === categoryId && t.date.startsWith(prefix) && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
}

export function budgetProgress(budgets: BudgetCategory[], transactions: Transaction[]) {
  const prefix = new Date().toISOString().slice(0, 7);
  const bySection = {
    income: { planned: 0, actual: 0 },
    fixed: { planned: 0, actual: 0 },
    flexible: { planned: 0, actual: 0 },
    non_monthly: { planned: 0, actual: 0 },
    goals: { planned: 0, actual: 0 },
  };

  for (const b of budgets) {
    bySection[b.section].planned += b.planned;
    if (b.section === 'income') {
      bySection.income.actual += incomeForCategory(transactions, b.categoryId, prefix);
    } else {
      bySection[b.section].actual += spentForCategory(transactions, b.categoryId, prefix);
    }
  }
  return bySection;
}
