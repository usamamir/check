import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  useFinance,
  spentForCategory,
  incomeForCategory,
  budgetProgress,
} from '../store/FinanceContext';
import { formatCurrency } from '../lib/format';
import { monthLabel } from '../lib/format';

const sections: { key: 'income' | 'fixed' | 'flexible' | 'non_monthly'; label: string; hint: string }[] = [
  { key: 'income', label: 'Income', hint: 'Expected monthly income' },
  { key: 'fixed', label: 'Fixed expenses', hint: 'Must-pay bills and subscriptions' },
  { key: 'flexible', label: 'Flexible expenses', hint: 'The one number to watch' },
  { key: 'non_monthly', label: 'Non-monthly', hint: 'Rollovers for irregular spend' },
];

export function Budget() {
  const { state, updateBudget, setBudgetMode, getCategory } = useFinance();
  const [open, setOpen] = useState<Record<string, boolean>>({
    income: true,
    fixed: true,
    flexible: true,
    non_monthly: true,
  });
  const month = new Date().toISOString().slice(0, 7);
  const progress = budgetProgress(state.budgets, state.transactions);
  const flexibleLeft = progress.flexible.planned - progress.flexible.actual;

  const rows = useMemo(() => {
    return sections.map((section) => {
      const items = state.budgets
        .filter((b) => b.section === section.key)
        .map((b) => {
          const cat = getCategory(b.categoryId);
          const actual =
            section.key === 'income'
              ? incomeForCategory(state.transactions, b.categoryId, month)
              : spentForCategory(state.transactions, b.categoryId, month);
          return { ...b, cat, actual };
        });
      return { ...section, items, summary: progress[section.key] };
    });
  }, [state.budgets, state.transactions, getCategory, month, progress]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="toolbar">
        <div>
          <div style={{ fontWeight: 700 }}>{monthLabel(month + '-01')}</div>
          <div className="card-meta">
            {state.budgetMode === 'flex'
              ? 'Flex budgeting — focus on one flexible number'
              : 'Category budgeting'}
          </div>
        </div>
        <div className="filters">
          <div className="segmented">
            <button
              className={state.budgetMode === 'flex' ? 'active' : ''}
              onClick={() => setBudgetMode('flex')}
            >
              Flex
            </button>
            <button
              className={state.budgetMode === 'category' ? 'active' : ''}
              onClick={() => setBudgetMode('category')}
            >
              Category
            </button>
          </div>
        </div>
      </div>

      {state.budgetMode === 'flex' ? (
        <div className="card card-pad" style={{ background: 'linear-gradient(135deg,#fff,#ffe8e2)' }}>
          <div className="card-meta">Left to spend in flexible</div>
          <div className="stat-value" style={{ color: flexibleLeft < 0 ? 'var(--negative)' : 'var(--text)' }}>
            {formatCurrency(flexibleLeft)}
          </div>
          <div className="progress" style={{ marginTop: 12, maxWidth: 420 }}>
            <span
              style={{
                width: `${Math.min(100, (progress.flexible.actual / Math.max(progress.flexible.planned, 1)) * 100)}%`,
                background: flexibleLeft < 0 ? 'var(--negative)' : 'var(--accent)',
              }}
            />
          </div>
          <div className="card-meta" style={{ marginTop: 8 }}>
            Spent {formatCurrency(progress.flexible.actual)} of{' '}
            {formatCurrency(progress.flexible.planned)} planned
          </div>
        </div>
      ) : null}

      {rows.map((section) => {
        const pct =
          (section.summary.actual / Math.max(section.summary.planned, 1)) * 100;
        const collapsed = !open[section.key];
        return (
          <div className="card" key={section.key}>
            <div
              className="group-header"
              onClick={() => setOpen((o) => ({ ...o, [section.key]: !o[section.key] }))}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  {section.label}
                </div>
                <div className="card-meta" style={{ marginLeft: 24 }}>
                  {section.hint}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="amount">
                  {formatCurrency(section.summary.actual)} / {formatCurrency(section.summary.planned)}
                </div>
                <div
                  className={`progress ${pct > 100 ? 'over' : 'green'}`}
                  style={{ width: 120, marginLeft: 'auto', marginTop: 6 }}
                >
                  <span style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            </div>
            {!collapsed &&
              section.items.map((item) => {
                const itemPct = (item.actual / Math.max(item.planned, 1)) * 100;
                return (
                  <div className="budget-row" key={item.categoryId}>
                    <div>
                      <div style={{ fontWeight: 650 }}>
                        {item.cat?.emoji} {item.cat?.name}
                      </div>
                      {item.rollover ? <span className="pill">Rollover</span> : null}
                    </div>
                    <div className="hide-sm amount" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(item.actual)}
                    </div>
                    <div className="hide-sm">
                      <div
                        className={`progress ${itemPct > 100 ? 'over' : itemPct > 85 ? 'warn' : 'green'}`}
                      >
                        <span style={{ width: `${Math.min(100, itemPct)}%` }} />
                      </div>
                    </div>
                    <div>
                      <input
                        className="text-input"
                        type="number"
                        value={item.planned}
                        onChange={(e) =>
                          updateBudget(item.categoryId, Number(e.target.value) || 0)
                        }
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
